import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
import json
import os

# ---------------- CONFIG ----------------
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20
DATASET_DIR = "dataset/train"
MODEL_PATH = "cow_model.h5"
CLASS_INDEX_PATH = "class_indices.json"

# ---------------- LIMIT TO FIRST 25 BREEDS ----------------
all_breeds = sorted(os.listdir(DATASET_DIR))
selected_breeds = all_breeds[:25]

print(f"✅ Training on {len(selected_breeds)} breeds:")
for b in selected_breeds:
    print(" -", b)

# ---------------- DATA GENERATOR ----------------
datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2,
    rotation_range=15,
    zoom_range=0.15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True
)

train_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    classes=selected_breeds,
    class_mode="categorical",
    subset="training",
    shuffle=True
)

val_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    classes=selected_breeds,
    class_mode="categorical",
    subset="validation",
    shuffle=False
)

NUM_CLASSES = train_gen.num_classes
print("🧠 Number of classes:", NUM_CLASSES)

# ---------------- MODEL ----------------
base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

base_model.trainable = False  # Transfer learning

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(256, activation="relu")(x)
x = Dropout(0.5)(x)
output = Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=Adam(learning_rate=1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# ---------------- TRAIN ----------------
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS
)

# ---------------- SAVE MODEL ----------------
model.save(MODEL_PATH)
print(f"✅ Model saved as {MODEL_PATH}")

# ---------------- SAVE CLASS INDICES (index -> breed) ----------------
class_indices = train_gen.class_indices  # breed -> index
index_to_class = {v: k for k, v in class_indices.items()}

with open(CLASS_INDEX_PATH, "w") as f:
    json.dump(index_to_class, f, indent=4)

print(f"✅ Class indices saved to {CLASS_INDEX_PATH}")
