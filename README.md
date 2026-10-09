# 🐮 Gau-Raksha AI: Indigenous Cattle Breed Classifier

<img width="1919" height="889" alt="image" src="https://github.com/user-attachments/assets/b1afa553-a821-4b0c-87ac-78b725020b32" />


## 📖 Overview

**Gau-Raksha AI** is a state-of-the-art computer vision system designed to digitally identify and preserve indigenous Indian cattle breeds. Using a custom fine-tuned **EfficientNetB4** architecture, this solution classifies **50 distinct breeds** with an overall accuracy of **85%+**.

This project addresses the critical challenge of visual similarity among indigenous breeds (e.g., *Malvi* vs. *Krishna Valley*) by leveraging High-Definition (380x380) image processing and deep transfer learning.

---

## 🚀 Key Features

* **50-Breed Support:** Comprehensive classification of 50 indigenous Indian cattle breeds.
* **High-Definition Analysis:** Processes images at **380x380 resolution** to capture fine-grained textures like horn shape and hump size.
* **Backend:** **FastAPI** inference with readiness checks, bounded uploads, and one prediction at a time.
* **Database:** Prediction history in **MongoDB Atlas**, with local JSON fallback for development only.
* **Robust Accuracy:** Achieves **99% precision** on distinct breeds like *Purnea* and *Bhelai*.

---

## 🛠️ Tech Stack

* **Core AI:** TensorFlow 2.x, Keras, EfficientNetB4
* **Backend:** Python 3.12, FastAPI, Uvicorn
* **Database:** MongoDB Atlas, PyMongo
* **Data Processing:** NumPy, Pillow (PIL), Pandas
* **Frontend hosting:** Render Static Sites or Vercel (the inference API is a separate service)

---

## 📊 Model Performance

The model was rigorously tested on a validation set of **1,917 images**.

| Metric | Score | Notes |
| :--- | :--- | :--- |
| **Overall Accuracy** | **85.4%** | Weighted F1-Score |
| **Top Precision** | **99%** | Breeds: *Purnea, Bhelai* |
| **Input Shape** | 380 x 380 | HD input for texture recognition |
| **Architecture** | EfficientNetB4 | Transfer Learning from ImageNet |

### 🏆 Top Performing Breeds
* **Purnea:** 99%
* **Bhelai:** 98%
* **Mewati:** 97%
* **Ponwar:** 97%
* **Siri:** 96%

---

## ⚙️ Installation & Setup

### Local development

Use Python **3.12** and Node **24**. The production entrypoint is `backend/main.py`;
`R_main.py` and `R_train_model.py` are older models and are not deployment entrypoints.

The original `backend/cattlenet_B4_phase1_epoch9.keras` is intentionally excluded
from Git. Obtain it from the project owner; do not train a substitute or change
`class_indices.json`. Its SHA-256 is
`aa768d034c50ded6ccc042502fd5e4d76c15858832c149bfc1a7347fb21e82eb`.

From a Windows PowerShell terminal:

```powershell
git clone https://github.com/kushpatel2601/Gau_rakshak_AI.git
Set-Location Gau_rakshak_AI
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
Copy-Item backend\.env.example backend\.env
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

### Homepage

The image-led homepage uses existing local breed photographs, a forest/cream
palette, glass hover surfaces and restrained scroll-linked hero depth. Homepage
copy and shared navigation are available in English, Hindi and Gujarati through
the existing language selector. Featured cards open the real breed profiles;
identification, reports and shared history continue to use the existing API.
The page explains confidence limits, breed-reference figures, shared/public
history and free-service cold starts rather than promising a verified identity.

`frontend/src/components/HomePage.jsx`, `frontend/src/homeContent.js` and
`frontend/src/home.css` contain the homepage implementation. Pointer tilt is
limited to fine mouse pointers. Reduced-motion preferences disable depth,
transitions and animation without hiding content. Navigation and FAQs are
keyboard-accessible, and mobile navigation remains visible.

Run the frontend checks and a production preview from `frontend`:

```powershell
npm test
$env:VITE_API_URL = "https://gau-raksha-api.onrender.com"
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

The live API only accepts its configured frontend origins. A localhost preview
can display the homepage and catalog, but uploads/history may be rejected by
CORS. Use request fixtures for local UI regression checks; do not weaken
production CORS just to preview a homepage. No backend or hosting configuration
change is required by this redesign.

Without MongoDB credentials, local development uses `backend/history.json`.
This is **not durable hosted storage**. Production must set `REQUIRE_MONGODB=true`:
a database outage then returns HTTP 503 instead of silently losing history on
an ephemeral filesystem. `MONGO_CLUSTER` is the Atlas hostname, not a connection
URI. The database user needs access to `DB_NAME` and Atlas network rules must
allow the backend's outbound addresses.

### Live deployment (free hosting only)

Verified on 2026-10-07:

* **Website:** https://gau-raksha-web.onrender.com
* **API readiness:** https://gau-raksha-api.onrender.com/health/ready
* **Model release:** https://github.com/kushpatel2601/Gau_rakshak_AI/releases/tag/model-float32-v1

The website uses a Render Static Site, a **free 512 MiB** LiteRT API in Singapore,
and a **MongoDB Atlas M0 free cluster** in AWS Singapore. No paid instances,
disks, paid database backup or card-backed trials were created. Free service
quotas still apply; the API **may sleep and cold-start**. This is not an
always-on or unlimited-capacity service. Keep `REQUIRE_MONGODB=true`.

Real browser upload, Gir prediction (78.7%), PDF download and history were
verified. API equivalence checks passed for five images plus three 16-megapixel
uploads. All eight existing history records survived an actual API restart onto
a replacement instance; readiness again reported `Online`, model loaded and
durable history available. Invalid uploads and cross-origin restrictions were
also checked. Render's 60-second memory samples reached **235.91 MiB** on the
active instance; these are sampled observations, **not instantaneous peak RSS
or a load-capacity guarantee**.

The deployed API is `srv-db34pa7lk1mc739ee8ag`; the static site is
`srv-db34pm142hec738j1j50`. Atlas permits the API's documented shared outbound
CIDRs `74.220.52.0/24` and `74.220.60.0/24`, not all internet addresses. Recheck
Render's outbound addresses before changing regions. Database secrets remain
backend-only; the frontend receives only the public API URL.

### Reproducing the deployment

**Render (both services):** `render.yaml` defines a Static Site and an explicitly
`free` Python API, with no paid disks or databases. Automatic deploys are off.
Use the prepared feature branch only after publishing authorization, and review
the provider's free-account eligibility before applying the blueprint. Fill all
`sync: false` environment values. `VITE_API_URL` is the API's public HTTPS origin;
`CORS_ORIGINS` is the Static Site's public HTTPS origin. The frontend must be
rebuilt after changing the API URL. The static build uses `frontend`, `npm ci`,
`npm run build`, `dist`, and a catch-all rewrite to `/index.html`, just like the
Vercel option below. Do not apply the blueprint before authorized model
distribution and Atlas credentials/network access are available.

**Optional frontend (Vercel):** its free plan hosts **only the frontend**, subject
to account/use eligibility. Use root directory `frontend`, Node 24, install command
`npm ci`, build command `npm run build`, and output `dist`. Set `VITE_API_URL`
to the actual backend HTTPS **origin** before building; changes require a
rebuild. `.env.example` is a template only. Builds deliberately fail without
this setting or with an insecure non-local origin. `vercel.json` supplies the
SPA rewrite. Never put MongoDB credentials or model-download secrets into
`VITE_*` variables: those values become public JavaScript.

**Backend configuration:** use root directory `backend`, Python 3.12 (see
`.python-version`), `REQUIRE_MONGODB=true`, the four MongoDB settings in
`.env.example`, and `CORS_ORIGINS=https://your-frontend.vercel.app`. Multiple
explicit frontend origins may be comma-separated; wildcards are rejected.
The Render blueprint installs **`requirements-lite.txt`**, not the native
TensorFlow requirements, and sets `INFERENCE_RUNTIME=litert` and
`MODEL_PATH=cattlenet_B4_float32.tflite`. Run one worker, without reload, with
bounded HTTP concurrency:

```bash
uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1 --limit-concurrency 4
```

The health check is `/health/ready`. It returns 503 for a missing/incompatible
model or unavailable required database. `/` provides the same readiness
information. An invalid image returns 400, an oversized upload 413, a busy or
unavailable service 503, and an inference failure 500. Predictions still use
RGB 380x380 input, the original 50-class order, and the existing 30% confidence
threshold. Uploads are limited to 8 MiB and decoded images to 16 megapixels.
History remains shared/public, not user-specific; this change adds no accounts.

**Model distribution:** the owner authorized the public optimized float32
artifact in the versioned release above. The original `.keras` remains local,
unpublished and ignored. Get explicit permission for any additional model
publication. This repository and its release assets are public; keep model
binaries out of normal Git commits. For the authorized HTTPS download, set `MODEL_URL`, `MODEL_PATH` and
the exact artifact's `MODEL_SHA256` as backend-only environment variables.
Then run `python model_artifact.py` during the backend build. It streams into
a temporary file, verifies SHA-256, and fails the build on missing, oversized,
corrupt or inaccessible artifacts. Signed URLs are secrets, must remain valid
for rebuilds, and are never logged. Existing files are verified too; merely
having a filename is not proof of the correct artifact.

### Float32 LiteRT candidate and measured limits

Native TensorFlow remains the local default. The explicitly selected LiteRT
option runs the **same original weights**, converted offline without retraining,
quantization, float16, label reordering or preprocessing changes. Convert only
in a local environment with the native requirements installed:

```powershell
.\.venv\Scripts\python.exe backend\convert_model.py
py -3.12 -m venv .venv-lite
.\.venv-lite\Scripts\python.exe -m pip install -r backend\requirements-lite.txt
```

The verified conversion is **70,430,324 bytes** with SHA-256
`21028dd135e2c14a320ad9abb20903a0a0592faf54dbb3a07f4cdbd76a06635f`.
The blueprint pins that exact artifact. A newly generated artifact must be
verified again; do not blindly replace the checksum. Conversion runs locally,
not during a free-host build.

Local measurements on Windows/Python 3.12:

| Runtime | Workload | Peak process RSS |
| --- | --- | --- |
| TensorFlow 2.19.1 / Keras 3.10.0 | Original model load + 50 images, without HTTP server | 605.59 MiB |
| LiteRT 2.3.0, no TensorFlow installed | Full Uvicorn/FastAPI server + 50 images | 261.13 MiB |
| Same LiteRT API | Additionally, nine 16-megapixel RGB/RGBA/grayscale requests | 386.48 MiB |

All 50 repository breed images retained the same top-1 class and 30% threshold
decision. All probability vectors passed `rtol=1e-4, atol=1e-5`; maximum absolute
score difference was `3.43e-5`. Floating-point execution order does change tiny
numerical details: three displayed confidence values changed by **0.01 percentage
point**: `Kokan Kapila.webp` 59.38% to 59.39%, `Nimari.webp` 54.93% to 54.94%,
and `Ponwar.webp` 90.82% to 90.81%. These images establish conversion parity, not new accuracy claims or
a guarantee for every possible input.

Those local measurements alone were **not proof of Linux/cgroup fit**. The
live checks above subsequently verified Python 3.12/LiteRT startup, real
predictions with MongoDB, and persistent history on the 512 MiB Linux service.
Concurrent traffic, cold starts and quotas remain operational limits, not
performance guarantees. Native TensorFlow already exceeds 512 MiB locally and
is not the free deployment runtime.

Do not enable a production URL until real `/predict` calls succeed and the
result appears in `/history` **after a service restart** with MongoDB still
connected. A frontend-only page or a 200 health check without model/database
readiness is not a complete deployment.

### Focused checks

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend -p "test_*.py"
Set-Location frontend
npm test
$env:VITE_API_URL="http://localhost:8000"
npm run build
```
