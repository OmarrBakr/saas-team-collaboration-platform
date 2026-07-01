const sendEmail = require('./sendEmail');

/**
 * Sends a workspace invitation email to the invitee.
 *
 * @param {object} params
 * @param {string} params.inviteeName
 * @param {string} params.inviterName
 * @param {string} params.email
 * @param {string} params.workspaceName
 * @param {string} params.inviteToken
 * @param {string} params.origin
 */
const sendInvitationEmail = async ({
  inviteeName,
  inviterName,
  email,
  workspaceName,
  inviteToken,
  origin,
}) => {
  const acceptUrl = `${origin}/workspaces/invite/accept?token=${inviteToken}&email=${encodeURIComponent(email)}`;

  const message = `
    <p style="margin: 0 0 16px; color: #374151; line-height: 1.7;">
      <strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong>.
    </p>
    <p style="margin: 0 0 16px; color: #374151; line-height: 1.7;">
      Accept the invite below to get access to boards, members, and workspace activity.
    </p>
    <p style="margin: 0 0 24px; color: #6b7280; font-size: 13px; line-height: 1.6;">
      This invitation expires in <strong>48 hours</strong>.
    </p>
    <p style="margin: 0 0 24px;">
      <a
        href="${acceptUrl}"
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
        Accept invitation
      </a>
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `You've been invited to "${workspaceName}"`,
    html: `
      <div style="margin: 0; padding: 24px; background-color: #f9fafb; font-family: Arial, sans-serif; color: #111827;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px;">
          <h2 style="margin: 0 0 12px; font-size: 20px; line-height: 1.3; color: #111827;">Hi ${inviteeName || email},</h2>
          ${message}
        </div>
      </div>
    `,
  });
};

module.exports = sendInvitationEmail;
