import crypto from "crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
export function sha256Base64Url(input) {
    return crypto.createHash("sha256").update(input).digest("base64url");
}
export async function hashPassword(password) {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}
export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}
//# sourceMappingURL=hash.js.map