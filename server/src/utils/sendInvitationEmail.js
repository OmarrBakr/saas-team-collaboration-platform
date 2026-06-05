const sendEmail = require('./sendEmail');

/**
 * Sends a workspace invitation email to the invitee.
 *
 * @param {object} params
 * @param {string} params.inviteeName  - Display name of the invitee (or their email)
 * @param {string} params.inviterName  - Display name of the person sending the invite
 * @param {string} params.email        - Recipient email address
 * @param {string} params.workspaceName - Name of the workspace
 * @param {string} params.inviteToken  - Raw (un-hashed) invitation token
 * @param {string} params.origin       - Frontend base URL (e.g. http://localhost:3000)
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
    <p>
      <strong>${inviterName}</strong> has invited you to join the workspace
      <strong>"${workspaceName}"</strong> on CollabSpace.
    </p>
    <p>Click the button below to accept the invitation. This link will expire in <strong>48 hours</strong>.</p>
    <p style="margin: 24px 0;">
      <a
        href="${acceptUrl}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #6366f1;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
        "
      >
        Accept Invitation
      </a>
    </p>
    <p style="color: #6b7280; font-size: 13px;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `You've been invited to "${workspaceName}"`,
    html: `
      <h4>Hello, ${inviteeName || email}!</h4>
      ${message}
    `,
  });
};

module.exports = sendInvitationEmail;
