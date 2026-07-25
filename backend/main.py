from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from urllib.parse import quote_plus
from pymongo import MongoClient

try:
    import tensorflow as tf
    from tensorflow.keras.applications.efficientnet import preprocess_input
except Exception:
    tf = None

    def preprocess_input(image_array):
        return image_array

# --- 1. Load Environment Variables ---
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Gau-Raksha AI Backend (EfficientNetB4)")

# --- 2. CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. Database Connection (Silent Failover) ---
JSON_DB_FILE = os.path.join(BASE_DIR, "history.json")
mongo_connected = False
collection = None

print("⏳ Initializing Database...")
try:
    username = os.getenv("MONGO_USERNAME")
    password = os.getenv("MONGO_PASSWORD")
    cluster = os.getenv("MONGO_CLUSTER")
    db_name = os.getenv("DB_NAME", "gaurakshak_db")

    if not username or not password or not cluster:
        # Just a warning, not an error that stops the app
        print("⚠️ Credentials missing in .env, defaulting to offline mode.")
    else:
        escaped_username = quote_plus(username)
        escaped_password = quote_plus(password)
        mongo_uri = f"mongodb+srv://{escaped_username}:{escaped_password}@{cluster}/?retryWrites=true&w=majority"

        # Short timeout for connection check
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')

        db = client[db_name]
        collection = db["predictions"]
        mongo_connected = True
        print(f"✅ ONLINE: Connected to MongoDB Cloud ({db_name})")

except Exception as e:
    print(
        f"⚠️ OFFLINE MODE: Could not reach Cloud DB. Using '{JSON_DB_FILE}'.")
    mongo_connected = False

if not mongo_connected and not os.path.exists(JSON_DB_FILE):
    with open(JSON_DB_FILE, "w") as f:
        json.dump([], f)

# --- 4. Helper Functions ---


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
        data = data[:100]  # Keep last 100 records
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


# --- 5. Load AI Model & Data ---
# ⚠️ UPDATE THIS FILENAME IF NEEDED
MODEL_FILENAME = os.path.join(BASE_DIR, "cattlenet_B4_phase1_epoch9.keras")

print(f"🔄 Loading AI model ({MODEL_FILENAME})...")
try:
    if os.path.exists(MODEL_FILENAME):
        model = tf.keras.models.load_model(MODEL_FILENAME)
        print("✅ Model loaded successfully!")
    else:
        print(
            f"❌ ERROR: Model file '{MODEL_FILENAME}' not found in current directory.")
        model = None
except Exception as e:
    print(f"❌ CRITICAL ERROR: Model failed to load. {e}")
    model = None

# Load Class Indices
try:
    class_indices_path = os.path.join(BASE_DIR, "class_indices.json")
    if os.path.exists(class_indices_path):
        with open(class_indices_path, "r") as f:
            class_indices = json.load(f)
            # Ensure keys are integers for correct mapping
            class_names = {int(k): v for k, v in class_indices.items()}
        print(f"✅ Loaded {len(class_names)} breeds from class_indices.json")
    else:
        print("⚠️ class_indices.json not found!")
        class_names = {}
except Exception as e:
    print("❌ Error loading class_indices.json:", e)
    class_names = {}

# Load Breed Info
try:
    breed_data_path = os.path.join(BASE_DIR, "breed_data.json")
    if os.path.exists(breed_data_path):
        with open(breed_data_path, encoding="utf-8") as f:
            breed_data = json.load(f)
        print("✅ Loaded breed info")
    else:
        print("⚠️ breed_data.json not found, using defaults.")
        breed_data = {}
except Exception:
    breed_data = {}

# --- 6. Endpoints ---


@app.get("/")
def root():
    return {
        "status": "Running",
        "mode": "Online" if mongo_connected else "Offline",
        "breeds_supported": len(class_names),
        "model_version": "EfficientNetB4 (85%+ Accuracy)"
    }


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
    if model is None:
        return {"error": "Model not loaded. Check server logs."}

    try:
        # 1. Read Image
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # 2. Resize to 380x380 (Mandatory for EfficientNetB4)
        img = img.resize((380, 380))

        # 3. Preprocess Image (Correct B4 Method)
        img_array = np.array(img)
        # expand_dims to make it (1, 380, 380, 3)
        img_array = np.expand_dims(img_array, axis=0)
        # Apply EfficientNet preprocessing (scales/normalizes automatically)
        img_array = preprocess_input(img_array)

        # 4. Make Prediction
        preds = model.predict(img_array)
        preds_list = preds[0]

        idx = int(np.argmax(preds_list))
        confidence = float(preds_list[idx] * 100)
        breed = class_names.get(idx, "Unknown")

        # 5. Debug Logs
        print(f"\n📸 Prediction: {breed} ({confidence:.2f}%)")

        # 6. Threshold Logic
        if confidence < 30.0:  # Slightly higher threshold for better model
            return {
                "breed": "Unknown",
                "confidence": round(confidence, 2),
                "message": "Low confidence match (Are you sure this is a cow?)",
                "milk_yield": "N/A",
                "fat_percentage": "N/A",
                "market_value": "N/A"
            }

        # 7. Fetch Info & Save
        info = breed_data.get(breed, {})

        record = {
            "breed": breed,
            "confidence": round(confidence, 2),
            "milk_yield": info.get("milk_yield", "N/A"),
            "fat_percentage": info.get("fat_percentage", "N/A"),
            "market_value": info.get("market_value", "N/A"),
            "timestamp": datetime.now().isoformat()
        }

        # Save to DB
        if mongo_connected:
            try:
                collection.insert_one(record)
                print("✅ Saved to Cloud DB")
            except:
                save_to_local_file(record)
        else:
            save_to_local_file(record)

        return {
            "breed": breed,
            "confidence": round(confidence, 2),
            **info
        }

    except Exception as e:
        print("❌ Prediction Error:", e)
        return {"error": "Prediction failed", "details": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)
