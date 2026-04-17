const resetPasswordTemplate = (resetUrl: string) => {
  return `
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>LifePlan - Reset Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 10px; padding: 24px; border: 1px solid #e5e7eb;">
          <h2 style="margin-top: 0; color: #111827;">Reset your password</h2>
          <p style="color: #374151; line-height: 1.6;">
            We received a request to reset your LifePlan account password.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            This link is valid for 15 minutes. If you did not request this, you can safely ignore this email.
          </p>
          <a
            href="${resetUrl}"
            style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 8px; margin: 8px 0;"
          >
            Reset password
          </a>
          <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-top: 16px;">
            If the button does not work, copy and paste this URL into your browser:<br />
            ${resetUrl}
          </p>
        </div>
      </body>
    </html>
  `;
};

export default resetPasswordTemplate;
