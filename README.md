# 🐮 Gau-Raksha AI: Indigenous Cattle Breed Classifier

(<img width="1919" height="889" alt="image" src="https://github.com/user-attachments/assets/b1afa553-a821-4b0c-87ac-78b725020b32" />
)

## 📖 Overview

**Gau-Raksha AI** is a state-of-the-art computer vision system designed to digitally identify and preserve indigenous Indian cattle breeds. Using a custom fine-tuned **EfficientNetB4** architecture, this solution classifies **50 distinct breeds** with an overall accuracy of **85%+**.

This project addresses the critical challenge of visual similarity among indigenous breeds (e.g., *Malvi* vs. *Krishna Valley*) by leveraging High-Definition (380x380) image processing and deep transfer learning.

---

## 🚀 Key Features

* **50-Breed Support:** Comprehensive classification of 50 indigenous Indian cattle breeds.
* **High-Definition Analysis:** Processes images at **380x380 resolution** to capture fine-grained textures like horn shape and hump size.
* **Production-Ready Backend:** High-performance **FastAPI** server with asynchronous inference.
* **Smart Database:** Automatic logging of predictions to **MongoDB Atlas** (Cloud) with a local JSON failover for offline use.
* **Robust Accuracy:** Achieves **99% precision** on distinct breeds like *Purnea* and *Bhelai*.

---

## 🛠️ Tech Stack

* **Core AI:** TensorFlow 2.x, Keras, EfficientNetB4
* **Backend:** Python 3.10+, FastAPI, Uvicorn
* **Database:** MongoDB Atlas, PyMongo
* **Data Processing:** NumPy, Pillow (PIL), Pandas
* **Deployment:** Docker-ready structure

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

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/gau-raksha-ai.git](https://github.com/your-username/gau-raksha-ai.git)
cd gau-raksha-ai
