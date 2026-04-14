const otpTemplate = (otp: string) => {
  return `
    <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LifePlan - Your OTP Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 0;">
    <div style="max-width: 640px; margin: 24px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #4338ca; padding: 24px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; text-align: center;">Your OTP Code</h1>
        </div>
        <div style="padding: 24px;">
            <p style="color: #374151; margin-bottom: 16px;">Hello,</p>
            <p style="color: #374151; margin-bottom: 16px;">Your One-Time Password (OTP) for account verification is:</p>
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="font-size: 36px; margin: 0; font-weight: 700; text-align: center; color: #4338ca; letter-spacing: 4px;">${otp}</p>
            </div>
            <p style="color: #374151; margin-bottom: 16px;">This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
            <p style="color: #374151; margin-bottom: 8px;">If you did not request this code, please ignore this email.</p>
            <p style="color: #374151; margin-bottom: 0;">Thank you for using our service.</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 12px 16px;">
            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">&copy; 2026 LifePlan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};

export default otpTemplate;
