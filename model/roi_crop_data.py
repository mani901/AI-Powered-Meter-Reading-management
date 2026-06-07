from ultralytics import YOLO
import cv2
import os
import sys

# ── Load ROI model ────────────────────────────────────────────────────────────
roi_model = YOLO(r"D:\FYP-AI-POWERED-METER\model\meter_roi_best.pt")

# ── Paths ─────────────────────────────────────────────────────────────────────
input_dir  = r"D:\FYP-AI-POWERED-METER\model\test"
output_dir = r"D:\FYP-AI-POWERED-METER\model\roi_crops"
os.makedirs(output_dir, exist_ok=True)

# ── Supported image extensions ────────────────────────────────────────────────
VALID_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}

# ── JPEG save quality (0-100) — 100 = maximum quality, zero compression loss ──
JPEG_QUALITY    = 100
PNG_COMPRESSION = 0      # 0 = no compression (lossless, larger file)

# ── Gather all image paths ────────────────────────────────────────────────────
image_paths = [
    os.path.join(input_dir, f)
    for f in os.listdir(input_dir)
    if os.path.splitext(f)[1].lower() in VALID_EXT
]

total = len(image_paths)
if total == 0:
    print("❌ No images found in input folder.")
    sys.exit()

print(f"✅ Found {total} images in : {input_dir}")
print(f"📁 Saving ROI crops to    : {output_dir}")
print(f"🖼️  JPEG quality           : {JPEG_QUALITY}/100  (lossless-grade)")
print(f"🖼️  PNG compression        : {PNG_COMPRESSION}/9   (0 = no compression)")
print("=" * 60)

# ── Save helpers (quality-preserving) ────────────────────────────────────────
def save_image(path, image):
    """
    Save image with maximum quality settings.
    - JPEG → quality=100, no subsampling, no optimisation tricks
    - PNG  → compression=0 (lossless, biggest file but zero quality loss)
    - Others → default cv2 write (already lossless for BMP/TIFF)
    """
    ext = os.path.splitext(path)[1].lower()

    if ext in (".jpg", ".jpeg"):
        cv2.imwrite(
            path,
            image,
            [
                cv2.IMWRITE_JPEG_QUALITY,        JPEG_QUALITY,   # 100 = best
                cv2.IMWRITE_JPEG_OPTIMIZE,        0,              # skip huffman opt
                cv2.IMWRITE_JPEG_PROGRESSIVE,     0,              # baseline JPEG
                cv2.IMWRITE_JPEG_LUMA_QUALITY,    JPEG_QUALITY,
                cv2.IMWRITE_JPEG_CHROMA_QUALITY,  JPEG_QUALITY,
            ]
        )

    elif ext == ".png":
        cv2.imwrite(
            path,
            image,
            [
                cv2.IMWRITE_PNG_COMPRESSION, PNG_COMPRESSION,    # 0 = no compression
            ]
        )

    else:
        # BMP / TIFF / WEBP → write as-is (BMP & TIFF are already lossless)
        cv2.imwrite(path, image)


# ── Counters ──────────────────────────────────────────────────────────────────
saved          = 0
skipped        = 0
full_fallbacks = 0

# ══════════════════════════════════════════════════════════════════════════════
# ── Main Loop ─────────────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
for idx, img_path in enumerate(image_paths, 1):

    filename  = os.path.basename(img_path)
    name, ext = os.path.splitext(filename)

    # ── Load image at full resolution, no downscale ───────────────────────────
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"  [{idx:>5}/{total}] ❌ Cannot read → {filename}")
        skipped += 1
        continue

    # Convert to BGR if loaded as BGRA (some PNGs have alpha channel)
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    h, w = img.shape[:2]

    # ── ROI detection ─────────────────────────────────────────────────────────
    results = roi_model(img, conf=0.25, verbose=False)
    boxes   = results[0].boxes

    # Retry with lower confidence if nothing detected
    if boxes is None or len(boxes) == 0:
        results = roi_model(img, conf=0.10, verbose=False)
        boxes   = results[0].boxes

    # ── Crop best box ─────────────────────────────────────────────────────────
    if boxes is None or len(boxes) == 0:
        # No ROI found → save full image as fallback (no resize, no quality loss)
        crop           = img.copy()
        note           = "FULL_FALLBACK"
        full_fallbacks += 1

    else:
        best        = boxes[boxes.conf.argmax()]
        x1, y1, x2, y2 = map(int, best.xyxy[0].tolist())

        # Padding — clamp to image boundary so crop stays valid
        pad = 15
        x1  = max(0, x1 - pad)
        y1  = max(0, y1 - pad)
        x2  = min(w, x2 + pad)
        y2  = min(h, y2 + pad)

        # Pure numpy slice → zero quality loss, no interpolation
        crop = img[y1:y2, x1:x2]
        note = f"conf:{float(best.conf[0]):.2f}  crop:{x2-x1}x{y2-y1}px"

    # ── Save with maximum quality ─────────────────────────────────────────────
    out_path = os.path.join(output_dir, f"{name}_roi{ext}")
    save_image(out_path, crop)
    saved += 1

    print(f"  [{idx:>5}/{total}] ✅ {filename:<45} → {note}")

# ══════════════════════════════════════════════════════════════════════════════
print("=" * 60)
print(f"  ✅ Saved         : {saved}")
print(f"  🔄 Full fallback : {full_fallbacks}  (no ROI detected)")
print(f"  ❌ Skipped       : {skipped}  (unreadable files)")
print(f"  📁 Output folder : {output_dir}")
print("=" * 60)

os.startfile(output_dir)