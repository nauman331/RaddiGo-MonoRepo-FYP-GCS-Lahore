export const getWelcomeEmailTemplate = (name: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TrustFarokht</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to TrustFarokht! 🎉</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">Hello ${name},</h2>
                            
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                We're thrilled to have you join the TrustFarokht community! You've taken the first step towards a more secure and trustworthy experience.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Here's what you can do next:
                            </p>
                            
                            <!-- Feature Cards -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                                        <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">✨ Complete Your Profile</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            Add your details to personalize your experience
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #764ba2;">
                                        <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">🔒 Secure Your Account</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            Enable two-factor authentication for extra security
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
                                        <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 16px; font-weight: 600;">🚀 Get Started</h3>
                                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                            Explore our features and start your journey
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                If you have any questions or need assistance, our support team is always here to help.
                            </p>
                            
                            <p style="margin: 0; color: #666666; font-size: 16px; line-height: 1.6;">
                                Best regards,<br>
                                <strong style="color: #333333;">The TrustFarokht Team</strong>
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
                                You're receiving this email because you signed up for TrustFarokht.
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
