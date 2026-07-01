const sendEmail = require('./sendEmail');

const sendResetPassswordEmail = async ({ name, email, token, origin }) => {
  const resetURL = `${origin}/reset-password?token=${token}&email=${email}`;

  const message = `
    <p style="margin: 0 0 16px; color: #374151; line-height: 1.7;">
      We received a request to reset your password. Click below to choose a new one.
    </p>
    <p style="margin: 0 0 24px; color: #6b7280; font-size: 13px; line-height: 1.6;">
      This link is valid for a limited time. If you didn’t request a reset, you can ignore this message.
    </p>
    <p style="margin: 0;">
      <a
        href="${resetURL}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 999px;
          font-weight: 700;
        "
      >
        Reset password
      </a>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="margin: 0; padding: 24px; background-color: #f9fafb; font-family: Arial, sans-serif; color: #111827;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; line-height: 1.3; color: #111827;">Hi ${name},</h2>
          ${message}
        </div>
      </div>
    `,
  });
};

module.exports = sendResetPassswordEmail;
