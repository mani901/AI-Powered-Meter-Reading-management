from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from ultralytics import YOLO

MODEL_DIR = Path(__file__).parent
roi_model   = YOLO(str(MODEL_DIR / "meter_roi_best.pt"))
digit_model = YOLO(str(MODEL_DIR / "best.pt"))

app = FastAPI(title="Meter Reading API")


def get_clahe_variants(crop_img: np.ndarray) -> dict:
    variants = {}
    gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)

    clahe_std = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    variants["V1_CLAHE_Standard"] = cv2.cvtColor(clahe_std.apply(gray), cv2.COLOR_GRAY2BGR)

    clahe_str = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(8, 8))
    variants["V2_CLAHE_Strong"] = cv2.cvtColor(clahe_str.apply(gray), cv2.COLOR_GRAY2BGR)

    clahe_fine = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
    variants["V3_CLAHE_FineGrid"] = cv2.cvtColor(clahe_fine.apply(gray), cv2.COLOR_GRAY2BGR)

    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
    clahe_bil = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    variants["V4_CLAHE_Bilateral"] = cv2.cvtColor(clahe_bil.apply(denoised), cv2.COLOR_GRAY2BGR)

    clahe_ush = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v5_base = clahe_ush.apply(gray)
    blurred = cv2.GaussianBlur(v5_base, (0, 0), sigmaX=2)
    v5 = cv2.addWeighted(v5_base, 1.5, blurred, -0.5, 0)
    variants["V5_CLAHE_UnsharpMask"] = cv2.cvtColor(v5, cv2.COLOR_GRAY2BGR)

    clahe_gam = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v6_base = clahe_gam.apply(gray)
    gamma = 0.6
    lut = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)], dtype=np.uint8)
    variants["V6_CLAHE_Gamma"] = cv2.cvtColor(cv2.LUT(v6_base, lut), cv2.COLOR_GRAY2BGR)

    clahe_sf = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(4, 4))
    variants["V7_CLAHE_Strong_Fine"] = cv2.cvtColor(clahe_sf.apply(gray), cv2.COLOR_GRAY2BGR)

    clahe_mor = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v8_base = clahe_mor.apply(gray)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    v8 = cv2.morphologyEx(v8_base, cv2.MORPH_OPEN, kernel)
    variants["V8_CLAHE_Morph"] = cv2.cvtColor(v8, cv2.COLOR_GRAY2BGR)

    return variants


def extract_reading(image_bytes: bytes) -> dict:
    buf = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        return None

    h, w = img.shape[:2]

    roi_results = roi_model(img, conf=0.25, verbose=False)
    roi_boxes = roi_results[0].boxes

    if roi_boxes is None or len(roi_boxes) == 0:
        roi_results = roi_model(img, conf=0.10, verbose=False)
        roi_boxes = roi_results[0].boxes

    if roi_boxes is None or len(roi_boxes) == 0:
        base_crop = img.copy()
    else:
        best_box = roi_boxes[roi_boxes.conf.argmax()]
        x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
        pad = 10
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad)
        y2 = min(h, y2 + pad)
        base_crop = img[y1:y2, x1:x2].copy()

    variants = get_clahe_variants(base_crop)
    class_names = digit_model.names
    all_results = {}

    for v_name, v_crop in variants.items():
        d_results = digit_model(v_crop, conf=0.20, verbose=False)
        d_boxes = d_results[0].boxes

        if d_boxes is None or len(d_boxes) == 0:
            detections = []
            reading = "NOT_FOUND"
        else:
            detections = []
            for b in d_boxes:
                bx1, by1, bx2, by2 = map(int, b.xyxy[0].tolist())
                cls   = int(b.cls[0])
                dconf = float(b.conf[0])
                cx    = (bx1 + bx2) / 2
                detections.append((cx, class_names[cls], dconf))

            detections.sort(key=lambda x: x[0])
            reading = "".join(d[1] for d in detections)

        avg_conf = sum(d[2] for d in detections) / len(detections) if detections else 0.0

        all_results[v_name] = {
            "reading":   reading,
            "avg_conf":  avg_conf,
            "n_digits":  len(detections),
        }

    ranked = sorted(all_results.items(), key=lambda x: x[1]["avg_conf"], reverse=True)
    best_name, best_res = ranked[0]

    return {
        "success":      True,
        "reading":      best_res["reading"],
        "best_variant": best_name,
        "confidence":   round(best_res["avg_conf"], 4),
        "num_digits":   best_res["n_digits"],
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await file.read()
    result = extract_reading(image_bytes)

    if result is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    return result
