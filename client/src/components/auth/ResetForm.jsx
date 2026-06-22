export default function ResetForm({
  form,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  message,
}) {
  return (
    <div className="success-card">
      <div className="success-pill">Reset link</div>
      <h2>Choose a new password.</h2>
      <p>Enter a new password below to finish resetting your account.</p>

      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          <span>New password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter a new password"
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          <span>Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Confirm your new password"
            autoComplete="new-password"
            required
          />
        </label>

        {error && <div className="status-message error">{error}</div>}
        {message && <div className="status-message success">{message}</div>}

        <button type="submit" className="primary-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}
