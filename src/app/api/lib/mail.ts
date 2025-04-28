import { Resend } from "resend";
import { logger } from "../lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendVerificationEmail(email: string, token: string) {
  const successLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email/success`;
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&redirect=${encodeURIComponent(successLink)}&email=${encodeURIComponent(email)}`;

  logger.info(`Sending verification email to: ${email}`);
  logger.debug(`Verification link: ${confirmLink}`);

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verify your email address",
      html: `<p>Click <a href="${confirmLink}">here</a> to verify your email.</p>`,
    });
    logger.info("Verification email sent successfully.");
  } catch (error) {
    logger.error("Error sending verification email:", { error });
    throw new Error("Failed to send verification email");
  }
}
