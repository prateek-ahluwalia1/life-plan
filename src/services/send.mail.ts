import * as nodemailer from "nodemailer";

// 1. Validate environment variables early
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } =
  process.env;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  throw new Error(
    "Missing required SMTP environment variables. Check your .env file.",
  );
}

// 2. Initialize transporter safely
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === "true",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  const sent = await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject,
    html,
  });

  if (!sent.messageId) {
    throw new Error("Failed to send email: no message ID returned");
  }

  console.log("Email sent successfully:", sent.messageId);
};
