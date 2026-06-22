export default function AuthSuccess({ user, message, onReset }) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="brand-badge">Flowvia</div>
        <h1>Welcome, {user.firstName || 'teammate'}.</h1>
        <p>
          Your account is ready. You can now move into boards, workspaces, and
          real-time collaboration.
        </p>

        <div className="feature-grid">
          <article>
            <span>Signed in</span>
            <strong>{user.email}</strong>
          </article>
          <article>
            <span>Status</span>
            <strong>Account ready</strong>
          </article>
          <article>
            <span>Next</span>
            <strong>Explore workspaces</strong>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="success-card">
          <div className="success-pill">Signed in</div>
          <h2>You're ready to continue.</h2>
          <p>{message}</p>
          <button
            type="button"
            className="primary-btn secondary-btn"
            onClick={onReset}
          >
            Back to sign in
          </button>
        </div>
      </section>
    </main>
  );
}
