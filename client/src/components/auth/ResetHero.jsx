export default function ResetHero({ email }) {
  return (
    <section className="auth-visual">
      <div className="brand-badge">Flowvia</div>
      <h1>Complete your password reset.</h1>
      <p>
        Use the link from your email to choose a new password and return to
        your workspace.
      </p>

      <div className="feature-grid">
        <article>
          <span>Account</span>
          <strong>{email || 'Your email'}</strong>
        </article>
        <article>
          <span>Step</span>
          <strong>Set a new password</strong>
        </article>
        <article>
          <span>Result</span>
          <strong>Return to sign in</strong>
        </article>
      </div>
    </section>
  );
}
