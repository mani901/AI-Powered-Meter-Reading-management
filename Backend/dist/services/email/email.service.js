import { mailer, mailFrom } from "../../config/mailer.js";
import { env } from "../../config/env.js";
export async function sendVerifyEmail(args) {
    const url = new URL("/verify-email", env.APP_URL);
    url.searchParams.set("token", args.token);
    await mailer.sendMail({
        from: mailFrom,
        to: args.to,
        subject: "Verify your SmartMeter account",
        text: `Hello ${args.name},\n\nVerify your email: ${url.toString()}\n\nIf you did not create an account, ignore this email.`,
        html: `
      <p>Hello ${escapeHtml(args.name)},</p>
      <p>Please verify your email to activate your SmartMeter account.</p>
      <p><a href="${url.toString()}">Verify email</a></p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
    });
}
export async function sendResetPasswordEmail(args) {
    const url = new URL("/reset-password", env.APP_URL);
    url.searchParams.set("token", args.token);
    await mailer.sendMail({
        from: mailFrom,
        to: args.to,
        subject: "Reset your SmartMeter password",
        text: `Hello ${args.name},\n\nReset your password: ${url.toString()}\n\nIf you did not request this, ignore this email.`,
        html: `
      <p>Hello ${escapeHtml(args.name)},</p>
      <p>You requested a password reset.</p>
      <p><a href="${url.toString()}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    });
}
function escapeHtml(input) {
    return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
//# sourceMappingURL=email.service.js.map