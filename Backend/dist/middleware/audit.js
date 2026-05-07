export function getClientIp(req) {
    const xf = req.headers["x-forwarded-for"];
    const forwarded = Array.isArray(xf) ? xf[0] : xf;
    if (forwarded)
        return forwarded.split(",")[0]?.trim();
    return req.socket.remoteAddress ?? undefined;
}
export function getUserAgent(req) {
    return req.headers["user-agent"];
}
//# sourceMappingURL=audit.js.map