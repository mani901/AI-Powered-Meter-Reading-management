import multer from "multer";
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 12 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
        if (!ok) {
            // Multer typing is strict; this matches runtime behavior.
            cb(new Error("Invalid file type. Please upload JPG, PNG, or WebP."));
            return;
        }
        cb(null, true);
    },
});
//# sourceMappingURL=upload.js.map