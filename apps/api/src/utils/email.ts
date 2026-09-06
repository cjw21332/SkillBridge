import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SkillBridge" <noreply@skillbridge.app>',
        to,
        subject,
        html,
        text,
      });
      console.log(`Email successfully sent to ${to}: "${subject}"`);
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
    }
  } else {
    // Development / Local environment fallback logger
    console.log(`[Email Service - Dev Mode] To: ${to} | Subject: "${subject}" | Content: ${text || subject}`);
  }
};
