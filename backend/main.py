from contextlib import asynccontextmanager
from datetime import datetime
import io
import json
import logging
import os
from pathlib import Path
import tempfile
from threading import Lock, Semaphore
from urllib.parse import quote_plus, urlsplit

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
import numpy as np
from PIL import Image, UnidentifiedImageError
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from model_artifact import verify_model

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
logger = logging.getLogger("uvicorn.error")

require_mongodb = os.getenv("REQUIRE_MONGODB", "false").lower()
if require_mongodb not in {"true", "false"}:
    raise ValueError("REQUIRE_MONGODB must be true or false.")
REQUIRE_MONGODB = require_mongodb == "true"
INFERENCE_RUNTIME = os.getenv("INFERENCE_RUNTIME", "tensorflow")
if INFERENCE_RUNTIME not in {"tensorflow", "litert"}:
    raise ValueError("INFERENCE_RUNTIME must be tensorflow or litert.")
JSON_DB_FILE = BASE_DIR / "history.json"
MODEL_FILENAME = BASE_DIR / os.getenv("MODEL_PATH", "cattlenet_B4_phase1_epoch9.keras")
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024
MAX_IMAGE_PIXELS = 16_000_000
inference_slot = Semaphore(1)
history_lock = Lock()
model = None
class_names = {}
breed_data = {}
client = None
collection = None
mongo_connected = False


def cors_origins():
    values = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    )
    origins = []
    for value in values.split(","):
        value = value.strip().rstrip("/")
        parsed = urlsplit(value)
        if (parsed.scheme not in {"http", "https"} or not parsed.netloc
                or parsed.username or parsed.password or parsed.path
                or parsed.query or parsed.fragment):
            raise ValueError("CORS_ORIGINS must contain explicit comma-separated origins.")
        origins.append(value)
    return origins


def initialize_database():
    global client, collection, mongo_connected
    username = os.getenv("MONGO_USERNAME")
    password = os.getenv("MONGO_PASSWORD")
    cluster = os.getenv("MONGO_CLUSTER")
    if not all((username, password, cluster)):
        logger.warning("MongoDB credentials missing; %s.",
                       "readiness will fail" if REQUIRE_MONGODB else "using local JSON history")
        return
    if any(char in cluster for char in "/:@?#"):
        logger.error("MONGO_CLUSTER must be a hostname, not a URI.")
        return
    uri = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{cluster}/?retryWrites=true&w=majority"
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000,
                             connectTimeoutMS=2000, socketTimeoutMS=5000)
        client.admin.command("ping")
        collection = client[os.getenv("DB_NAME", "gaurakshak_db")]["predictions"]
        mongo_connected = True
        logger.info("Connected to MongoDB.")
    except (PyMongoError, ValueError) as exc:
        logger.error("MongoDB initialization failed (%s); %s.", type(exc).__name__,
                     "readiness will fail" if REQUIRE_MONGODB else "using local JSON history")
        if client is not None:
            client.close()
        client = None


def initialize_model():
    global model, class_names, breed_data
    try:
        with (BASE_DIR / "class_indices.json").open(encoding="utf-8") as handle:
            class_names = {int(key): value for key, value in json.load(handle).items()}
        with (BASE_DIR / "breed_data.json").open(encoding="utf-8") as handle:
            breed_data = json.load(handle)
        if set(class_names) != set(range(50)):
            raise ValueError("class_indices.json must preserve all 50 output indices.")
        if os.getenv("MODEL_SHA256"):
            verify_model(MODEL_FILENAME, os.environ["MODEL_SHA256"])
        if INFERENCE_RUNTIME == "litert":
            from ai_edge_litert.interpreter import Interpreter

            model = Interpreter(model_path=str(MODEL_FILENAME), num_threads=1)
            inputs, outputs = model.get_input_details(), model.get_output_details()
            if (len(inputs) != 1 or len(outputs) != 1
                    or tuple(inputs[0]["shape"]) != (1, 380, 380, 3)
                    or tuple(outputs[0]["shape"]) != (1, 50)
                    or inputs[0]["dtype"] != np.float32 or outputs[0]["dtype"] != np.float32):
                raise ValueError("Expected float32 RGB 380x380 input and 50-class output.")
            model.allocate_tensors()
        else:
            import tensorflow as tf

            tf.config.threading.set_intra_op_parallelism_threads(1)
            tf.config.threading.set_inter_op_parallelism_threads(1)
            model = tf.keras.models.load_model(MODEL_FILENAME, compile=False)
            if model.input_shape != (None, 380, 380, 3) or model.output_shape != (None, 50):
                raise ValueError("Expected the original 380x380 RGB, 50-class EfficientNetB4 model.")
        logger.info("Loaded EfficientNetB4 for %s inference (50 classes).", INFERENCE_RUNTIME)
    except Exception:
        # A failed startup remains inspectable, but must never pass readiness.
        model = None
        logger.exception("Model initialization failed; predictions are unavailable.")


@asynccontextmanager
async def lifespan(app):
    initialize_database()
    await run_in_threadpool(initialize_model)
    yield
    if client is not None:
        client.close()


app = FastAPI(title="Gau-Raksha AI Backend (EfficientNetB4)", lifespan=lifespan)


class UploadLimitMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] != "/predict":
            await self.app(scope, receive, send)
            return
        length = dict(scope["headers"]).get(b"content-length")
        if length and length.isdigit() and int(length) > MAX_REQUEST_BYTES:
            await JSONResponse({"detail": "Upload exceeds the 8 MiB limit."}, status_code=413)(
                scope, receive, send)
            return
        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            received += len(message.get("body", b""))
            if received > MAX_REQUEST_BYTES:
                raise HTTPException(413, "Upload exceeds the 8 MiB limit.")
            return message

        await self.app(scope, limited_receive, send)


app.add_middleware(UploadLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def read_local_history():
    if not JSON_DB_FILE.exists():
        return []
    with JSON_DB_FILE.open(encoding="utf-8") as handle:
        records = json.load(handle)
    if not isinstance(records, list):
        raise ValueError("Local history is not a list.")
    return records


def save_local_history(record):
    with history_lock:
        records = [record, *read_local_history()][:100]
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=BASE_DIR,
                                             prefix="history-", suffix=".tmp", delete=False) as handle:
                temporary = Path(handle.name)
                json.dump(records, handle, indent=4)
            os.replace(temporary, JSON_DB_FILE)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)


def save_history(record):
    if mongo_connected:
        try:
            collection.insert_one(dict(record))
            return
        except PyMongoError as exc:
            logger.error("MongoDB history write failed (%s).", type(exc).__name__)
    if REQUIRE_MONGODB:
        raise HTTPException(503, "Durable history is unavailable. Prediction was not saved.")
    try:
        save_local_history(record)
    except (OSError, ValueError) as exc:
        logger.error("Local history write failed (%s).", type(exc).__name__)
        raise HTTPException(503, "History could not be saved.") from exc


@app.get("/")
@app.get("/health/ready")
def readiness():
    database_ready = mongo_connected
    if mongo_connected:
        try:
            client.admin.command("ping")
        except PyMongoError as exc:
            database_ready = False
            logger.error("MongoDB readiness check failed (%s).", type(exc).__name__)
    ready = model is not None and (database_ready or not REQUIRE_MONGODB)
    return JSONResponse({
        "status": "Ready" if ready else "Unavailable",
        "model_loaded": model is not None,
        "inference_runtime": INFERENCE_RUNTIME,
        "mode": "Online" if database_ready else "Offline",
        "durable_history": database_ready,
        "breeds_supported": len(class_names),
        "model_version": "EfficientNetB4 (85%+ Accuracy)",
    }, status_code=200 if ready else 503)


@app.get("/history")
def get_history():
    if mongo_connected:
        try:
            return list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
        except PyMongoError as exc:
            logger.error("MongoDB history read failed (%s).", type(exc).__name__)
    if REQUIRE_MONGODB:
        raise HTTPException(503, "Durable history is unavailable.")
    try:
        with history_lock:
            return read_local_history()
    except (OSError, ValueError) as exc:
        logger.error("Local history read failed (%s).", type(exc).__name__)
        raise HTTPException(503, "History could not be read.") from exc


def predict_image(image_bytes):
    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            if source.width * source.height > MAX_IMAGE_PIXELS:
                raise HTTPException(413, "Image exceeds the 16 megapixel limit.")
            img = source.convert("RGB").resize((380, 380))
        # EfficientNetB4 includes its own rescaling. Keep raw RGB values [0, 255].
        img_array = np.expand_dims(np.asarray(img, dtype=np.float32), axis=0)
    except Image.DecompressionBombError as exc:
        raise HTTPException(413, "Image exceeds the 16 megapixel limit.") from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(400, "Upload a valid, readable image.") from exc

    try:
        if INFERENCE_RUNTIME == "litert":
            model.set_tensor(model.get_input_details()[0]["index"], img_array)
            model.invoke()
            preds = model.get_tensor(model.get_output_details()[0]["index"])[0]
        else:
            preds = np.asarray(model.predict(img_array, verbose=0))[0]
        if preds.shape != (50,) or not np.all(np.isfinite(preds)):
            raise ValueError("Invalid model output.")
    except Exception as exc:
        logger.exception("Model inference failed.")
        raise HTTPException(500, "Prediction failed. Check server logs.") from exc
    idx = int(np.argmax(preds))
    confidence = float(preds[idx] * 100)
    breed = class_names[idx]
    if confidence < 30.0:
        return {
            "breed": "Unknown",
            "confidence": round(confidence, 2),
            "message": "Low confidence match (Are you sure this is a cow?)",
            "milk_yield": "N/A",
            "fat_percentage": "N/A",
            "market_value": "N/A",
        }
    info = breed_data.get(breed, {})
    save_history({
        "breed": breed,
        "confidence": round(confidence, 2),
        "milk_yield": info.get("milk_yield", "N/A"),
        "fat_percentage": info.get("fat_percentage", "N/A"),
        "market_value": info.get("market_value", "N/A"),
        "timestamp": datetime.now().isoformat(),
    })
    return {"breed": breed, "confidence": round(confidence, 2), **info}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if model is None:
            raise HTTPException(503, "Model is unavailable. Check server logs.")
        if REQUIRE_MONGODB and not mongo_connected:
            raise HTTPException(503, "Durable history is unavailable.")
        if not inference_slot.acquire(blocking=False):
            raise HTTPException(503, "The model is busy. Please retry shortly.",
                                headers={"Retry-After": "2"})
        try:
            image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
            if len(image_bytes) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, "Upload exceeds the 8 MiB limit.")
            return await run_in_threadpool(predict_image, image_bytes)
        finally:
            inference_slot.release()
    finally:
        await file.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
