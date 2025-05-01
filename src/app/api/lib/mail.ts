import { Resend } from "resend";
import { logger } from "../lib/logger";
import { apiRouteConfig } from "./apiRouteConfig";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const successLink = `${process.env.NEXT_PUBLIC_APP_URL}${apiRouteConfig.publicRoutes.verifyEmailSuccess}`;
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api${apiRouteConfig.publicRoutes.verifyEmail}?token=${token}&redirect=${encodeURIComponent(successLink)}&email=${encodeURIComponent(email)}`;

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

export async function sendInviteEmail(
  token: string,
  email: string,
  orgName: string
) {
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/api${apiRouteConfig.publicRoutes.acceptInvite}?token=${token}&email=${encodeURIComponent(email)}`;

  logger.info(`Sending invite email to: ${email}`);
  logger.debug(`Invite link: ${inviteLink}`);

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: `Join ${orgName} on Our Platform`,
      html: `<p>You have been invited to join ${orgName}. Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`,
    });
    logger.info("Invitation email sent successfully.");
  } catch (error) {
    logger.error("Error sending invitation email:", { error });
    throw new Error("Failed to send invitation email");
  }
}
