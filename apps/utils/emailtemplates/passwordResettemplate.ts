export const getPasswordResetEmailTemplate = (otp: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Verification Code 🔐</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
                            
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                We received a request for your TrustFarokht account. Use the verification code below to complete your request.
                            </p>
                            
                            <!-- OTP Display -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);">
                                            <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Your OTP Code</p>
                                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Notice -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                                        <h3 style="margin: 0 0 10px 0; color: #856404; font-size: 16px; font-weight: 600;">⚠️ Security Notice</h3>
                                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                            This verification code will expire in <strong>15 minutes</strong> for security reasons.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Please enter this code in the application to proceed. Do not share this code with anyone.
                            </p>
                            
                            <!-- Didn't Request -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px; background-color: #e7f3ff; border-radius: 6px; border-left: 4px solid #2196F3;">
                                        <h3 style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px; font-weight: 600;">ℹ️ Didn't Request This?</h3>
                                        <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.5;">
                                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged, and your account is secure.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                If you continue to have problems, please contact our support team.
                            </p>
                            
                            <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Best regards,<br>
                                <strong style="color: #333333;">The TrustFarokht Security Team</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                                © ${new Date().getFullYear()} TrustFarokht. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                This is an automated security email. Please do not reply to this message.
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
