"""Offline float32 conversion; never run conversion on a small hosted instance."""

import argparse
import hashlib
from pathlib import Path
import tempfile

from model_artifact import verify_model

BASE_DIR = Path(__file__).resolve().parent
SOURCE_SHA256 = "aa768d034c50ded6ccc042502fd5e4d76c15858832c149bfc1a7347fb21e82eb"


def convert(source, destination):
    verify_model(source, SOURCE_SHA256)
    if destination.exists():
        raise FileExistsError("Refusing to overwrite an existing converted model.")
    import tensorflow as tf

    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.config.threading.set_inter_op_parallelism_threads(1)
    model = tf.keras.models.load_model(source, compile=False)
    if model.input_shape != (None, 380, 380, 3) or model.output_shape != (None, 50):
        raise ValueError("Expected the original EfficientNetB4 model.")
    with tempfile.TemporaryDirectory(prefix="gau-model-") as directory:
        model.export(directory, format="tf_saved_model", verbose=False,
                     input_signature=[tf.TensorSpec((1, 380, 380, 3), tf.float32)])
        converter = tf.lite.TFLiteConverter.from_saved_model(directory)
        # No quantization, float16 optimization, representative dataset or retraining.
        converter.optimizations = []
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS]
        converted = converter.convert()
    destination.write_bytes(converted)
    print(f"Converted float32 model: {len(converted)} bytes")
    print(f"SHA-256: {hashlib.sha256(converted).hexdigest()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=BASE_DIR / "cattlenet_B4_phase1_epoch9.keras")
    parser.add_argument("--output", type=Path, default=BASE_DIR / "cattlenet_B4_float32.tflite")
    args = parser.parse_args()
    convert(args.source, args.output)
