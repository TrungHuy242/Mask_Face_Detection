import tensorflow as tf
import cv2
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / 'models' / 'mask_detector_v1.keras'
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

CLASS_NAMES = ['mask_weared_incorrect', 'with_mask', 'without_mask']
COLORS = {
    'with_mask': (0, 255, 0),
    'without_mask': (0, 0, 255),
    'mask_weared_incorrect': (255, 165, 0)
}

def preprocess_face(face):
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = cv2.resize(face, (128, 128))
    face = face.astype("float32")
    face = tf.keras.applications.mobilenet_v2.preprocess_input(face)
    face = np.expand_dims(face, axis=0)
    return face

def preprocess_face_batch(face):
    """Preprocess face without adding batch dimension (for batch processing)"""
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
    
    # Batch preprocessing
    faces_preprocessed = np.array([
        preprocess_face_batch(image[y:y+h, x:x+w]) 
        for (x, y, w, h) in faces
    ])
    
    # Batch prediction
    preds = model.predict(faces_preprocessed, verbose=0)
    
    results = []
    for i, (x, y, w, h) in enumerate(faces):
        idx = np.argmax(preds[i])
        results.append({
            "bbox": [int(x), int(y), int(x+w), int(y+h)],
            "label": CLASS_NAMES[idx],
            "confidence": float(preds[i][idx])
        })
    
    return results

def predict_mask_frame(frame):
    return predict_mask_image(frame)