from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

app = FastAPI(title="Gau-Raksha AI Backend")

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Global Variables ----------------
mongo_connected = False
collection = None
JSON_DB_FILE = "history.json"

# ---------------- Database Setup (Silent Failover) ----------------
print("⏳ Initializing Database...")

try:
    username = os.getenv("MONGO_USERNAME")
    password = os.getenv("MONGO_PASSWORD")
    cluster = os.getenv("MONGO_CLUSTER")
    db_name = os.getenv("DB_NAME", "gaurakshak_db")

    if not username or not password or not cluster:
        raise Exception("Credentials missing")

    escaped_username = quote_plus(username)
    escaped_password = quote_plus(password)
    mongo_uri = f"mongodb+srv://{escaped_username}:{escaped_password}@{cluster}/?retryWrites=true&w=majority"

    # Try connecting with short timeout
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
    client.admin.command('ping')

    db = client[db_name]
    collection = db["predictions"]
    mongo_connected = True
    print(f"✅ ONLINE: Connected to MongoDB Cloud ({db_name})")

except Exception as e:
    # ---------------------------------------------------------------
    # CLEAN LOGS: We suppress the massive SSL error text here
    # ---------------------------------------------------------------
    print(f"⚠️ NETWORK BLOCK DETECTED: Could not reach Cloud Database.")
    print(f"✅ OFFLINE MODE ACTIVE: Using local '{JSON_DB_FILE}' instead.")
    mongo_connected = False

    # Ensure local file exists
    if not os.path.exists(JSON_DB_FILE):
        with open(JSON_DB_FILE, "w") as f:
            json.dump([], f)

# ---------------- Helper Functions ----------------


def save_to_local_file(record):
    try:
        data = []
        if os.path.exists(JSON_DB_FILE):
            with open(JSON_DB_FILE, "r") as f:
                try:
                    data = json.load(f)
                except:
                    data = []
        data.insert(0, record)
        with open(JSON_DB_FILE, "w") as f:
            json.dump(data, f, indent=4)
        print("✅ Saved to local storage")
    except Exception as e:
        print(f"❌ Save failed: {e}")


def read_from_local_file():
    if not os.path.exists(JSON_DB_FILE):
        return []
    try:
        with open(JSON_DB_FILE, "r") as f:
            return json.load(f)
    except:
        return []


# ---------------- Model & Data ----------------
print("🔄 Loading AI model...")
try:
    model = tf.keras.models.load_model("cow_model.h5")
    print("✅ Model loaded")
except Exception:
    print("❌ Model failed to load")

with open("class_indices.json") as f:
    class_indices = json.load(f)
class_names = {int(k): v for k, v in class_indices.items()}

with open("breed_data.json", encoding="utf-8") as f:
    breed_data = json.load(f)

# ---------------- Endpoints ----------------


@app.get("/")
def root():
    return {"status": "Running", "mode": "Online" if mongo_connected else "Offline"}


@app.get("/history")
def get_history():
    if mongo_connected:
        try:
            return list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
        except:
            return read_from_local_file()
    return read_from_local_file()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        arr = preprocess_input(np.expand_dims(
            np.array(img, dtype=np.float32), axis=0))

        preds = model.predict(arr)[0]
        idx = int(np.argmax(preds))
        confidence = round(float(preds[idx] * 100), 2)
        breed = class_names.get(idx, "Unknown")

        if confidence < 25:
            return {"breed": "Unknown", "confidence": confidence, "milk_yield": "N/A"}

        info = breed_data.get(breed, {})
        print(f"🐄 {breed} ({confidence}%)")

        # Save Data
        record = {
            "breed": breed, "confidence": confidence,
            "milk_yield": info.get("milk_yield", "N/A"),
            "fat_percentage": info.get("fat_percentage", "N/A"),
            "market_value": info.get("market_value", "N/A"),
            "timestamp": datetime.now().isoformat()
        }

        if mongo_connected:
            try:
                collection.insert_one(record)
                print("✅ Saved to Cloud")
            except:
                save_to_local_file(record)
        else:
            save_to_local_file(record)

        return {"breed": breed, "confidence": confidence, **info}

    except Exception as e:
        print("❌ Error:", e)
        return {"error": "Prediction failed"}
