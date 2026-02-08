import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# =========================
# LOAD MODEL
# =========================
model = tf.keras.models.load_model("cow_model.h5")

# =========================
# DATA
# =========================
test_gen = ImageDataGenerator(rescale=1./255).flow_from_directory(
    "dataset/train",
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    shuffle=False
)

# =========================
# PREDICTIONS
# =========================
predictions = model.predict(test_gen)
y_pred = np.argmax(predictions, axis=1)
y_true = test_gen.classes

class_names = list(test_gen.class_indices.keys())

# =========================
# REPORT
# =========================
print("\n📊 Classification Report\n")
print(classification_report(y_true, y_pred, target_names=class_names))

print("\n🧩 Confusion Matrix\n")
print(confusion_matrix(y_true, y_pred))
