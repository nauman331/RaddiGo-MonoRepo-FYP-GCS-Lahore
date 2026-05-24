import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) : Promise<void> => {
    try {
        const port = Number(process.env.NODEMAILER_PORT);
        
        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_HOST,
            port: port,
            secure: port === 465, // Must be true for 465, false for 587
            auth: {
                user: process.env.NODEMAILER_USER,
                pass: process.env.NODEMAILER_PASS
            }
        });

        const mailOptions = {
            // Use a dedicated env variable for the verified sender address
            from: `"RaddiGo" <${process.env.NODEMAILER_FROM_EMAIL}>`,
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
}
