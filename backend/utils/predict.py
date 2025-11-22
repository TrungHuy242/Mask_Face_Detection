import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import tensorflow as tf
import cv2
import numpy as np
from pathlib import Path
import gc

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / 'models' / 'mask_detector_v1.keras'

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# Load lighter
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

CLASS_NAMES = ['mask_weared_incorrect', 'with_mask', 'without_mask']

def preprocess(face):
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = cv2.resize(face, (128, 128))
    face = face.astype("float32")
    face = tf.keras.applications.mobilenet_v2.preprocess_input(face)
    return face

def predict_mask_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(60,60))

    if len(faces) == 0:
        return []

    faces = faces[:3]  # limit to reduce RAM

    batch = np.array([preprocess(image[y:y+h, x:x+w]) for (x, y, w, h) in faces])

    preds = model.predict(batch, verbose=0)

    results = []
    for i, (x, y, w, h) in enumerate(faces):
        idx = np.argmax(preds[i])
        results.append({
            "bbox": [int(x), int(y), int(x+w), int(y+h)],
            "label": CLASS_NAMES[idx],
            "confidence": float(preds[i][idx])
        })

    gc.collect()   # force cleanup
    return results

def predict_mask_frame(frame):
    return predict_mask_image(frame)
