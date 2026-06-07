from ultralytics import YOLO
import cv2
import sys
import numpy as np
import os

# ── Load both models ──────────────────────────────────────────────────────────
roi_model   = YOLO(r"D:\FYP-AI-POWERED-METER\model\meter_roi_best.pt")
digit_model = YOLO(r"D:\FYP-AI-POWERED-METER\model\best.pt")

# ── Output folder ─────────────────────────────────────────────────────────────
output_dir = r"D:\FYP-AI-POWERED-METER\model\output"
os.makedirs(output_dir, exist_ok=True)

# ── Input image ───────────────────────────────────────────────────────────────
img_path = r"D:\FYP-AI-POWERED-METER\model\test\202511051133304458471E.jpg"

img = cv2.imread(img_path)
if img is None:
    print("❌ Image not found. Check the path.")
    sys.exit()

h, w = img.shape[:2]
print(f"✅ Image loaded: {w}x{h}px")

# ══════════════════════════════════════════════════════════════════════════════
# ── CLAHE Family Variants (all based on CLAHE — best performer) ───────────────
# ══════════════════════════════════════════════════════════════════════════════
def get_clahe_variants(crop_img):
    """
    All variants are CLAHE-based or proven enhancers of CLAHE.
    Goal: squeeze maximum digit detection accuracy from the ROI crop.
    """
    variants = {}

    gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)

    # ── V1: CLAHE Standard (your current best — baseline) ────────────────────
    # clipLimit=3.0, tileGridSize=8x8
    clahe_std  = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v1         = clahe_std.apply(gray)
    variants["V1_CLAHE_Standard"] = cv2.cvtColor(v1, cv2.COLOR_GRAY2BGR)

    # ── V2: CLAHE Strong (higher clip = more aggressive contrast) ─────────────
    # clipLimit=5.0 pushes darker regions brighter → better digit separation
    clahe_str  = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(8, 8))
    v2         = clahe_str.apply(gray)
    variants["V2_CLAHE_Strong"] = cv2.cvtColor(v2, cv2.COLOR_GRAY2BGR)

    # ── V3: CLAHE Fine Grid (smaller tiles = more local contrast) ────────────
    # tileGridSize=4x4 → finer local regions → better for small digits
    clahe_fine = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
    v3         = clahe_fine.apply(gray)
    variants["V3_CLAHE_FineGrid"] = cv2.cvtColor(v3, cv2.COLOR_GRAY2BGR)

    # ── V4: CLAHE + Bilateral Filter (smooth noise, keep edges sharp) ─────────
    # Bilateral removes noise BEFORE CLAHE → cleaner digit edges
    denoised   = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
    clahe_bil  = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v4         = clahe_bil.apply(denoised)
    variants["V4_CLAHE_Bilateral"] = cv2.cvtColor(v4, cv2.COLOR_GRAY2BGR)

    # ── V5: CLAHE + Unsharp Mask (sharpen after CLAHE) ───────────────────────
    # Unsharp mask = original - blurred → adds back fine digit strokes
    clahe_ush  = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v5_base    = clahe_ush.apply(gray)
    blurred    = cv2.GaussianBlur(v5_base, (0, 0), sigmaX=2)
    v5         = cv2.addWeighted(v5_base, 1.5, blurred, -0.5, 0)
    variants["V5_CLAHE_UnsharpMask"] = cv2.cvtColor(v5, cv2.COLOR_GRAY2BGR)

    # ── V6: CLAHE + Gamma Correction (brighten dark meter displays) ───────────
    # Gamma < 1 brightens → useful for dark LCD/LED meter faces
    clahe_gam  = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v6_base    = clahe_gam.apply(gray)
    gamma      = 0.6   # <1 = brighten
    lut        = np.array([
        ((i / 255.0) ** gamma) * 255
        for i in range(256)
    ], dtype=np.uint8)
    v6         = cv2.LUT(v6_base, lut)
    variants["V6_CLAHE_Gamma"] = cv2.cvtColor(v6, cv2.COLOR_GRAY2BGR)

    # ── V7: CLAHE Strong + Fine Grid (combine both aggressive settings) ───────
    clahe_sf   = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(4, 4))
    v7         = clahe_sf.apply(gray)
    variants["V7_CLAHE_Strong_Fine"] = cv2.cvtColor(v7, cv2.COLOR_GRAY2BGR)

    # ── V8: CLAHE + Morphological Open (remove small noise blobs) ────────────
    clahe_mor  = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    v8_base    = clahe_mor.apply(gray)
    kernel     = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    v8         = cv2.morphologyEx(v8_base, cv2.MORPH_OPEN, kernel)
    variants["V8_CLAHE_Morph"] = cv2.cvtColor(v8, cv2.COLOR_GRAY2BGR)

    return variants


# ══════════════════════════════════════════════════════════════════════════════
# ── Step 1: ROI Detection ─────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
print("\n🔍 Step 1: Detecting meter region...")
roi_results = roi_model(img, conf=0.25, verbose=False)
roi_boxes   = roi_results[0].boxes

if roi_boxes is None or len(roi_boxes) == 0:
    print("❌ No meter region detected. Trying lower confidence (0.10)...")
    roi_results = roi_model(img, conf=0.10, verbose=False)
    roi_boxes   = roi_results[0].boxes

roi_preview = img.copy()

if roi_boxes is None or len(roi_boxes) == 0:
    print("❌ Still no meter detected. Using full image as fallback.")
    base_crop = img.copy()
    x1, y1, x2, y2 = 0, 0, w, h
    cv2.putText(
        roi_preview,
        "No ROI Detected - Using Full Image",
        (20, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.5,
        (0, 0, 255),
        3
    )
else:
    for box in roi_boxes:
        bx1, by1, bx2, by2 = map(int, box.xyxy[0].tolist())
        bconf = float(box.conf[0])
        cv2.rectangle(roi_preview, (bx1, by1), (bx2, by2), (255, 200, 0), 2)
        cv2.putText(
            roi_preview,
            f"Meter {bconf:.2f}",
            (bx1, max(by1 - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 200, 0),
            2
        )

    best_box        = roi_boxes[roi_boxes.conf.argmax()]
    x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
    conf            = float(best_box.conf[0])

    pad = 10
    x1 = max(0, x1 - pad)
    y1 = max(0, y1 - pad)
    x2 = min(w, x2 + pad)
    y2 = min(h, y2 + pad)

    cv2.rectangle(roi_preview, (x1, y1), (x2, y2), (0, 255, 0), 4)
    label = f"BEST ROI  conf: {conf:.2f}"
    (lw, lh), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
    label_y = max(y1 - lh - baseline - 10, 0)
    cv2.rectangle(roi_preview, (x1, label_y), (x1 + lw + 10, y1), (0, 255, 0), -1)
    cv2.putText(
        roi_preview, label,
        (x1 + 5, y1 - baseline - 4),
        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2
    )

    base_crop = img[y1:y2, x1:x2].copy()
    print(f"✅ Meter region found: ({x1},{y1}) → ({x2},{y2})  conf: {conf:.2f}")

# Save ROI outputs
cv2.imwrite(os.path.join(output_dir, "1_roi_detection.jpg"), roi_preview)
cv2.imwrite(os.path.join(output_dir, "2_roi_crop_original.jpg"), base_crop)
print(f"💾 ROI preview saved → {output_dir}")

# ══════════════════════════════════════════════════════════════════════════════
# ── Step 2: Run digit detection on all CLAHE variants ────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
print("\n🔢 Step 2: Running digit detection on all CLAHE variants...")
print("=" * 65)

variants    = get_clahe_variants(base_crop)
class_names = digit_model.names
all_results = {}

for v_name, v_crop in variants.items():

    cv2.imwrite(os.path.join(output_dir, f"crop_{v_name}.jpg"), v_crop)

    d_results = digit_model(v_crop, conf=0.20, verbose=False)
    d_boxes   = d_results[0].boxes

    digit_preview = v_crop.copy()

    if d_boxes is None or len(d_boxes) == 0:
        reading    = "NOT FOUND"
        detections = []
        cv2.putText(
            digit_preview, "No Digits Detected",
            (10, 40), cv2.FONT_HERSHEY_SIMPLEX,
            0.8, (0, 0, 255), 2
        )
    else:
        detections = []
        for b in d_boxes:
            bx1, by1, bx2, by2 = map(int, b.xyxy[0].tolist())
            cls   = int(b.cls[0])
            dconf = float(b.conf[0])
            cx    = (bx1 + bx2) / 2
            detections.append((cx, class_names[cls], dconf, bx1, by1, bx2, by2))

        detections.sort(key=lambda x: x[0])
        reading = ''.join([d[1] for d in detections])

        for cx, digit, dconf, bx1, by1, bx2, by2 in detections:
            cv2.rectangle(digit_preview, (bx1, by1), (bx2, by2), (0, 165, 255), 2)
            cv2.putText(
                digit_preview,
                f"{digit}({dconf:.2f})",
                (bx1, max(by1 - 6, 15)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 165, 255), 2
            )

    # Confidence score = avg confidence of all detected digits
    avg_conf = (
        sum(d[2] for d in detections) / len(detections)
        if detections else 0.0
    )

    # Reading bar
    reading_label = f"Reading: {reading}  avgConf:{avg_conf:.2f}"
    (rw, rh), _   = cv2.getTextSize(
        reading_label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2
    )
    bar_y = max(digit_preview.shape[0] - rh - 20, 0)
    cv2.rectangle(
        digit_preview,
        (0, bar_y),
        (digit_preview.shape[1], digit_preview.shape[0]),
        (0, 0, 0), -1
    )
    cv2.putText(
        digit_preview, reading_label,
        (6, digit_preview.shape[0] - 6),
        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2
    )

    cv2.imwrite(os.path.join(output_dir, f"digit_{v_name}.jpg"), digit_preview)

    all_results[v_name] = {
        "reading"       : reading,
        "detections"    : detections,
        "avg_conf"      : avg_conf,
        "n_digits"      : len(detections),
        "digit_preview" : digit_preview,
        "crop"          : v_crop,
    }

    status = "✅" if reading != "NOT FOUND" else "❌"
    print(f"  {status} [{v_name}]")
    print(f"       Reading  : {reading}")
    print(f"       Digits   : {len(detections)}   AvgConf: {avg_conf:.3f}")

# ══════════════════════════════════════════════════════════════════════════════
# ── Step 3: Score & Rank variants ────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

def score_variant(res):
    """
    Score is based strictly on the highest average confidence score.
    """
    return res["avg_conf"]

ranked = sorted(
    all_results.items(),
    key=lambda x: score_variant(x[1]),
    reverse=True
)

best_name, best_res = ranked[0]

# ══════════════════════════════════════════════════════════════════════════════
# ── Step 4: Build summary grid (2 rows × 4 cols) ──────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
TARGET_H = 380

def resize_to_height(image, target_h):
    ih, iw = image.shape[:2]
    scale  = target_h / ih
    return cv2.resize(image, (max(1, int(iw * scale)), target_h))

def add_panel_label(panel, title, subtitle="", is_best=False, rank=0):
    out   = panel.copy()
    bar_h = 60

    # Header color: gold for best, green for top3, dark for rest
    if is_best:
        hdr_color = (0, 140, 255)   # orange-gold
    elif rank <= 2:
        hdr_color = (0, 100, 0)
    else:
        hdr_color = (30, 30, 30)

    cv2.rectangle(out, (0, 0), (out.shape[1], bar_h), hdr_color, -1)

    crown = " 👑 BEST" if is_best else f" #{rank+1}"
    cv2.putText(out, f"{title}{crown}", (6, 22),
                cv2.FONT_HERSHEY_SIMPLEX, 0.58,
                (255, 255, 255), 2)
    cv2.putText(out, subtitle, (6, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                (0, 255, 255), 2)

    # Border
    border = (0, 215, 255) if is_best else (60, 60, 60)
    thick  = 4 if is_best else 1
    cv2.rectangle(out, (0, 0), (out.shape[1]-1, out.shape[0]-1), border, thick)

    return out

panels = []

# ROI panel first
roi_panel = resize_to_height(roi_preview, TARGET_H)
cv2.rectangle(roi_panel, (0, 0), (roi_panel.shape[1], 60), (20, 20, 60), -1)
cv2.putText(roi_panel, "ROI Detection", (6, 22),
            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 255), 2)
cv2.putText(roi_panel, f"Crop: {base_crop.shape[1]}x{base_crop.shape[0]}px",
            (6, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1)
panels.append(roi_panel)

# Variant panels in ranked order
for rank, (v_name, res) in enumerate(ranked):
    panel    = resize_to_height(res["digit_preview"], TARGET_H)
    is_best  = (rank == 0)
    subtitle = f"→ {res['reading']}  | {res['n_digits']}digits  conf:{res['avg_conf']:.2f}"

    panel = add_panel_label(
        panel,
        v_name.replace("_", " "),
        subtitle,
        is_best=is_best,
        rank=rank
    )
    panels.append(panel)

# ── Arrange into rows of 3 ────────────────────────────────────────────────────
max_h   = max(p.shape[0] for p in panels)
max_w   = max(p.shape[1] for p in panels)

def pad_panel(panel, target_h, target_w):
    ph, pw = panel.shape[:2]
    pad_h  = np.zeros((max(0, target_h - ph), pw, 3), dtype=np.uint8)
    panel  = np.vstack([panel, pad_h]) if pad_h.shape[0] > 0 else panel
    pad_w  = np.zeros((panel.shape[0], max(0, target_w - panel.shape[1]), 3),
                      dtype=np.uint8)
    panel  = np.hstack([panel, pad_w]) if pad_w.shape[1] > 0 else panel
    return panel

panels = [pad_panel(p, max_h, max_w) for p in panels]

ROW_SIZE = 3
rows = []
for i in range(0, len(panels), ROW_SIZE):
    chunk = panels[i:i + ROW_SIZE]
    # Fill incomplete row
    while len(chunk) < ROW_SIZE:
        chunk.append(np.zeros((max_h, max_w, 3), dtype=np.uint8))
    rows.append(np.hstack(chunk))

divider = np.full((5, rows[0].shape[1], 3), 60, dtype=np.uint8)
summary = rows[0]
for row in rows[1:]:
    summary = np.vstack([summary, divider, row])

summary_path = os.path.join(output_dir, "SUMMARY_CLAHE_variants.jpg")
cv2.imwrite(summary_path, summary)
print(f"\n💾 Summary grid saved → {summary_path}")

# ══════════════════════════════════════════════════════════════════════════════
# ── Final Report ──────────────────────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 65)
print("  📊 CLAHE VARIANT RANKING")
print("=" * 65)
print(f"  {'Rank':<5} {'Variant':<28} {'Reading':<15} {'Digits':<8} {'AvgConf':<9} {'Score'}")
print(f"  {'-'*4} {'-'*27} {'-'*14} {'-'*7} {'-'*8} {'-'*7}")

for rank, (v_name, res) in enumerate(ranked):
    sc  = score_variant(res)
    tag = " 👑" if rank == 0 else ("  ⭐" if rank <= 2 else "")
    print(
        f"  #{rank+1:<4} {v_name:<28} "
        f"{res['reading']:<15} {res['n_digits']:<8} "
        f"{res['avg_conf']:<9.3f} {sc:.3f}{tag}"
    )

print("=" * 65)
print(f"\n  🏆 BEST VARIANT  : {best_name}")
print(f"  📟 METER READING : {best_res['reading']}")
print(f"  🔢 DIGITS FOUND  : {best_res['n_digits']}")
print(f"  📈 AVG CONFIDENCE: {best_res['avg_conf']:.3f}")
print("=" * 65)

os.startfile(output_dir)
print(f"\n📁 Output folder: {output_dir}")