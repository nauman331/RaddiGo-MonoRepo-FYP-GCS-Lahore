import { sendEmail } from "../ThirdPartyservices/mailsender";
import { getWelcomeEmailTemplate } from "./emailtemplates/welcomeTemplate";
import { getPasswordResetEmailTemplate } from "./emailtemplates/passwordResettemplate";

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
    const subject = "Welcome to TrustFarokht!";
    const html = getWelcomeEmailTemplate(name);
    await sendEmail(to, subject, html);
}

export const sendPasswordResetEmail = async (to: string, otp: string): Promise<void> => {
    const subject = "Your Verification Code";
    const html = getPasswordResetEmailTemplate(otp);
    await sendEmail(to, subject, html);
}