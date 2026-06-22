export default function AuthForm({
  isRegister,
  form,
  onChange,
  onSubmit,
  onForgotPassword,
  isSubmitting,
  error,
  message,
  submitLabel,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {isRegister && (
        <div className="two-up">
          <label>
            <span>First name</span>
            <input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              placeholder="John"
              autoComplete="given-name"
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </label>
        </div>
      )}

      <label>
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={onChange}
          placeholder="john@company.com"
          autoComplete="email"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          value={form.password}
          onChange={onChange}
          placeholder="Enter your password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
      </label>

      {error && <div className="status-message error">{error}</div>}
      {message && <div className="status-message success">{message}</div>}

      <button type="submit" className="primary-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait...' : submitLabel}
      </button>

      {!isRegister && (
        <button
          type="button"
          className="text-btn"
          onClick={onForgotPassword}
          disabled={isSubmitting}
        >
          Forgot password?
        </button>
      )}
    </form>
  );
}
