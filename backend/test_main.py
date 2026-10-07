import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

from fastapi.testclient import TestClient
import numpy as np
from PIL import Image
from pymongo.errors import ConnectionFailure

import main


class APITests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.model = Mock()
        self.model.predict.return_value = np.array([[0.9, *([0.1 / 49] * 49)]], dtype=np.float32)
        with (main.BASE_DIR / "class_indices.json").open() as handle:
            names = {int(key): value for key, value in json.load(handle).items()}
        self.state = patch.multiple(
            main, model=self.model, class_names=names,
            breed_data={"Amritmahal": {"milk_yield": "2-4 Liters/Day"}},
            REQUIRE_MONGODB=False, mongo_connected=False, client=None, collection=None,
            INFERENCE_RUNTIME="tensorflow",
            JSON_DB_FILE=Path(self.directory.name) / "history.json",
        )
        self.state.start()
        self.addCleanup(self.state.stop)
        # Startup is tested separately; HTTP tests use deterministic predictions.
        self.api = TestClient(main.app)
        self.addCleanup(self.api.close)

    def image(self, mode="RGB", size=(20, 10)):
        buffer = io.BytesIO()
        Image.new(mode, size).save(buffer, format="PNG")
        return buffer.getvalue()

    def predict(self, image=None):
        image = self.image() if image is None else image
        return self.api.post("/predict", files={"file": ("cow.png", image, "image/png")})

    def test_prediction_preserves_shape_mapping_and_history(self):
        response = self.predict()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"breed": "Amritmahal", "confidence": 90.0,
                                          "milk_yield": "2-4 Liters/Day"})
        pixels = self.model.predict.call_args.args[0]
        self.assertEqual(pixels.shape, (1, 380, 380, 3))
        self.assertEqual(pixels.dtype, np.float32)
        self.assertEqual(self.api.get("/history").json()[0]["breed"], "Amritmahal")

    def test_rgba_and_grayscale_remain_supported(self):
        for mode in ("RGBA", "L"):
            with self.subTest(mode=mode):
                self.assertEqual(self.predict(self.image(mode)).status_code, 200)

    def test_preprocessing_keeps_raw_rgb_values(self):
        buffer = io.BytesIO()
        Image.new("RGB", (1, 1), (255, 128, 64)).save(buffer, format="PNG")
        self.assertEqual(self.predict(buffer.getvalue()).status_code, 200)
        np.testing.assert_array_equal(self.model.predict.call_args.args[0][0, 0, 0], [255, 128, 64])

    def test_litert_branch_uses_original_input_and_output_order(self):
        main.INFERENCE_RUNTIME = "litert"
        self.model.get_input_details.return_value = [{"index": 0}]
        self.model.get_output_details.return_value = [{"index": 99}]
        self.model.get_tensor.return_value = self.model.predict.return_value
        response = self.predict()
        self.assertEqual(response.json()["breed"], "Amritmahal")
        self.assertEqual(self.model.set_tensor.call_args.args[1].shape, (1, 380, 380, 3))
        self.model.invoke.assert_called_once()
        self.model.get_tensor.assert_called_once_with(99)
        self.model.predict.assert_not_called()

    def test_low_confidence_is_not_saved(self):
        self.model.predict.return_value = np.full((1, 50), 0.02, dtype=np.float32)
        self.assertEqual(self.predict().json()["breed"], "Unknown")
        self.assertEqual(self.api.get("/history").json(), [])

    def test_missing_model_is_not_healthy_or_successful(self):
        main.model = None
        for url in ("/", "/health/ready"):
            self.assertEqual(self.api.get(url).status_code, 503)
        self.assertEqual(self.predict().status_code, 503)

    def test_missing_mongo_blocks_production(self):
        main.REQUIRE_MONGODB = True
        self.assertEqual(self.api.get("/health/ready").status_code, 503)
        self.assertEqual(self.api.get("/history").status_code, 503)
        self.assertEqual(self.predict().status_code, 503)
        self.model.predict.assert_not_called()
        self.assertFalse(main.JSON_DB_FILE.exists())

    def test_runtime_mongo_failure_never_silently_falls_back_in_production(self):
        main.REQUIRE_MONGODB = True
        main.mongo_connected = True
        main.collection = Mock()
        main.collection.insert_one.side_effect = ConnectionFailure("unavailable")
        main.collection.find.side_effect = ConnectionFailure("unavailable")
        main.client = Mock()
        main.client.admin.command.side_effect = ConnectionFailure("unavailable")
        self.assertEqual(self.predict().status_code, 503)
        self.assertEqual(self.api.get("/history").status_code, 503)
        self.assertEqual(self.api.get("/health/ready").status_code, 503)
        self.assertFalse(main.JSON_DB_FILE.exists())

    def test_invalid_image_is_400(self):
        self.assertEqual(self.predict(b"not an image").status_code, 400)
        self.assertEqual(self.predict(b"").status_code, 400)

    def test_large_body_is_rejected_before_inference(self):
        response = self.api.post("/predict", content=b"x",
                                 headers={"content-length": str(main.MAX_REQUEST_BYTES + 1)})
        self.assertEqual(response.status_code, 413)
        self.model.predict.assert_not_called()

    def test_large_chunked_body_is_rejected(self):
        def chunks():
            yield b'--test\r\nContent-Disposition: form-data; name="file"; filename="cow.png"\r\n\r\n'
            yield b"x" * (main.MAX_REQUEST_BYTES + 1)
            yield b"\r\n--test--\r\n"
        response = self.api.post("/predict", content=chunks(),
                                 headers={"Content-Type": "multipart/form-data; boundary=test"})
        self.assertEqual(response.status_code, 413)
        self.model.predict.assert_not_called()

    def test_decoded_image_limit(self):
        with patch.object(main, "MAX_IMAGE_PIXELS", 100):
            self.assertEqual(self.predict().status_code, 413)
        self.model.predict.assert_not_called()

    def test_busy_model_rejects_instead_of_queueing_unbounded_images(self):
        main.inference_slot.acquire()
        try:
            self.assertEqual(self.predict().status_code, 503)
        finally:
            main.inference_slot.release()

    def test_inference_failure_releases_slot(self):
        self.model.predict.side_effect = RuntimeError("test failure")
        self.assertEqual(self.predict().status_code, 500)
        self.model.predict.side_effect = None
        self.assertEqual(self.predict().status_code, 200)

    def test_corrupt_history_is_explicit_and_not_overwritten(self):
        main.JSON_DB_FILE.write_text("{invalid")
        self.assertEqual(self.api.get("/history").status_code, 503)
        self.assertEqual(self.predict().status_code, 503)
        self.assertEqual(main.JSON_DB_FILE.read_text(), "{invalid")

    def test_local_history_keeps_only_last_100(self):
        for index in range(105):
            main.save_local_history({"index": index})
        records = self.api.get("/history").json()
        self.assertEqual(len(records), 100)
        self.assertEqual(records[0]["index"], 104)

    def test_cors_allows_only_configured_origins_including_errors(self):
        main.model = None
        response = self.api.get("/health/ready", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5173")
        self.assertEqual(response.status_code, 503)
        response = self.api.get("/health/ready", headers={"Origin": "https://untrusted.example"})
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_cors_rejects_wildcard(self):
        with patch.dict("os.environ", {"CORS_ORIGINS": "*"}):
            with self.assertRaises(ValueError):
                main.cors_origins()


if __name__ == "__main__":
    unittest.main()
