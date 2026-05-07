import { Router } from "express";
export const exampleRouter = Router();
exampleRouter.get("/", (_req, res) => {
    res.json({
        ok: true,
        message: "Example route (no-op).",
    });
});
//# sourceMappingURL=example.js.map