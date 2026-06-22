import { useMemo, useState } from 'react';

import { resetPassword } from '../services/auth';
import '../styles/auth.css';

const initialForm = {
  password: '',
  confirmPassword: '',
};

const getQueryValue = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
};

export default function ResetPasswordPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const token = useMemo(() => getQueryValue('token'), []);
  const email = useMemo(() => getQueryValue('email'), []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token || !email) {
      setError('Your reset link is incomplete. Please request a new one from the sign in page.');
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        token,
        email,
        password: form.password,
      });

      setMessage('Your password has been reset. You can now sign in with the new password.');
      setForm(initialForm);
      setIsComplete(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
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

      <section className="auth-card">
        <div className="success-card">
          <div className="success-pill">Reset link</div>
          {isComplete ? (
            <>
              <h2>Password updated.</h2>
              <p>{message}</p>
              <a className="primary-btn" href="/">
                Go to sign in
              </a>
            </>
          ) : (
            <>
              <h2>Choose a new password.</h2>
              <p>
                Enter a new password below to finish resetting your account.
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  <span>New password</span>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                  />
                </label>

                <label>
                  <span>Confirm password</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                </label>

                {error && <div className="status-message error">{error}</div>}
                {message && <div className="status-message success">{message}</div>}

                <button type="submit" className="primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Save new password'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
