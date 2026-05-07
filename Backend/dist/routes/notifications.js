import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import { toPaginatedResponse, toPagination } from "../lib/response.js";
export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
notificationsRouter.get("/", async (req, res) => {
    const { page, limit, skip } = toPagination(req.query);
    const isRead = typeof req.query.isRead === "string" ? req.query.isRead : undefined;
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const where = {
        userId: req.user.id,
        ...(isRead === "true" ? { isRead: true } : isRead === "false" ? { isRead: false } : {}),
        ...(type ? { type } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    ]);
    res.json(toPaginatedResponse({ data: rows.map(toDto), page, limit, total }));
});
notificationsRouter.get("/unread-count", async (req, res) => {
    const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ unreadCount: count });
});
notificationsRouter.patch("/:id/read", async (req, res) => {
    const id = req.params.id;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n)
        throw new NotFoundError("Notification not found");
    if (n.userId !== req.user.id)
        throw new ForbiddenError();
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ notification: toDto(updated) });
});
notificationsRouter.post("/read-all", async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ ok: true });
});
notificationsRouter.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n)
        throw new NotFoundError("Notification not found");
    if (n.userId !== req.user.id)
        throw new ForbiddenError();
    await prisma.notification.delete({ where: { id } });
    res.status(204).end();
});
function toDto(n) {
    return {
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: n.link ?? undefined,
        createdAt: n.createdAt.toISOString(),
    };
}
//# sourceMappingURL=notifications.js.map