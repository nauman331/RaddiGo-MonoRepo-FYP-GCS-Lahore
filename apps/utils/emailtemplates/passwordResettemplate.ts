export const getPasswordResetEmailTemplate = (otp: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RaddiGo - Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="width: 100%; max-width: 580px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0; margin: 20px 10px;">
                    
                    <!-- Header with RaddiGo Theme Gradient -->
                    <tr>
                        <td style="padding: 40px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 8px 18px; border-radius: 50px; margin-bottom: 12px; backdrop-filter: blur(4px);">
                                <span style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">RaddiGo Security</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; tracking-tight: -0.5px;">Password Reset Code 🔐</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Body Content -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Assalam-o-Alaikum,</h2>
                            
                            <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                We received a request to reset your password for your <strong>RaddiGo</strong> account. Use the 6-digit verification code below to proceed with creating a new password.
                            </p>
                            
                            <!-- Hero OTP Badge Container -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 28px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="padding: 24px 32px; background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; text-align: center;">
                                            <p style="margin: 0; color: #047857; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Your Verification Code</p>
                                            <p style="margin: 10px 0 0 0; color: #059669; font-size: 38px; font-weight: 900; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace;">${otp}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Alert Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 16px 20px; background-color: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b;">
                                        <h3 style="margin: 0 0 6px 0; color: #92400e; font-size: 14px; font-weight: 700;">⚠️ Code Expiration</h3>
                                        <p style="margin: 0; color: #a16207; font-size: 13px; line-height: 1.5;">
                                            This verification code will expire in <strong>15 minutes</strong>. Never share this code with anyone, including RaddiGo support staff.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Didn't Request Info -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                                <tr>
                                    <td style="padding: 16px 20px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #64748b;">
                                        <h3 style="margin: 0 0 6px 0; color: #334155; font-size: 14px; font-weight: 700;">ℹ️ Didn't request a password reset?</h3>
                                        <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5;">
                                            If you did not make this request, you can safely ignore this email. Your current password remains active and secure.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 28px 0 0 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Shukriya,<br>
                                <strong style="color: #0f172a; font-size: 15px;">RaddiGo Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                            <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px; font-weight: 600;">
                                © ${new Date().getFullYear()} RaddiGo App. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                                This is an automated email. Please do not reply directly to this message.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
