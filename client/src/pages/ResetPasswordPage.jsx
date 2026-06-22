import { useMemo, useState } from 'react';

import { resetPassword } from '../services/auth';
import ResetForm from '../components/auth/ResetForm';
import ResetHero from '../components/auth/ResetHero';
import ResetSuccess from '../components/auth/ResetSuccess';
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
      <ResetHero email={email} />

      <section className="auth-card">
        {isComplete ? (
          <ResetSuccess message={message} />
        ) : (
          <ResetForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            message={message}
          />
        )}
      </section>
    </main>
  );
}
