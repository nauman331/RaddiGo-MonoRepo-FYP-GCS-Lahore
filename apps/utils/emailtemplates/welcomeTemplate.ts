export const getWelcomeEmailTemplate = (name: string): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to RaddiGo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="width: 100%; max-width: 580px; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0; margin: 20px 10px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 32px 40px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 8px 18px; border-radius: 50px; margin-bottom: 12px; backdrop-filter: blur(4px);">
                                <span style="color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Welcome Aboard</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; tracking-tight: -0.5px;">Welcome to RaddiGo! 🎉</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Body Content -->
                    <tr>
                        <td style="padding: 36px 36px 28px 36px;">
                            <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 22px; font-weight: 700;">Assalam-o-Alaikum ${name},</h2>
                            
                            <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                We're thrilled to have you join the <strong>RaddiGo</strong> family! Selling your household scrap (raddi) at market rates is now faster, easier, and 100% digital.
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #0f172a; font-size: 16px; font-weight: 700;">
                                Here is what you can do with RaddiGo:
                            </p>
                            
                            <!-- Feature Card 1 -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 18px 20px; background-color: #ecfdf5; border-radius: 14px; border-left: 4px solid #059669;">
                                        <h3 style="margin: 0 0 6px 0; color: #065f46; font-size: 15px; font-weight: 700;">📦 Request Doorstep Scrap Pickup</h3>
                                        <p style="margin: 0; color: #047857; font-size: 13px; line-height: 1.5;">
                                            Book a pickup for paper, plastic, metal & electronics right from your doorstep.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Feature Card 2 -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 18px 20px; background-color: #ecfdf5; border-radius: 14px; border-left: 4px solid #10b981;">
                                        <h3 style="margin: 0 0 6px 0; color: #065f46; font-size: 15px; font-weight: 700;">💰 Instant Wallet Credit</h3>
                                        <p style="margin: 0; color: #047857; font-size: 13px; line-height: 1.5;">
                                            Get instant, seamless payment credited directly to your RaddiGo Wallet upon pickup completion.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Feature Card 3 -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 18px 20px; background-color: #ecfdf5; border-radius: 14px; border-left: 4px solid #059669;">
                                        <h3 style="margin: 0 0 6px 0; color: #065f46; font-size: 15px; font-weight: 700;">📍 Real-Time Live Tracking</h3>
                                        <p style="margin: 0; color: #047857; font-size: 13px; line-height: 1.5;">
                                            Track your assigned scrap collector's live location on the map in real-time.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                If you have any questions or need help setting up, our support team is always here for you.
                            </p>
                            
                            <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Warm regards,<br>
                                <strong style="color: #0f172a; font-size: 15px;">The RaddiGo Team</strong>
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
                                You are receiving this email because you created an account on RaddiGo.
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
