import { useMemo, useState, useEffect } from 'react';

import { forgetPassword, login, register, getCurrentUser } from '../services/auth';
import AuthForm from '../components/auth/AuthForm';
import AuthHero from '../components/auth/AuthHero';
import AuthSuccess from '../components/auth/AuthSuccess';
import AuthTabs from '../components/auth/AuthTabs';
import '../styles/auth.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await getCurrentUser();
        if (data && data.user) {
          setUser(data.user);
          setMessage('Signed in successfully.');
        }
      } catch (err) {
        // Silently ignore authorization failure on mount
      }
    };
    checkSession();
  }, []);

  const isRegister = activeTab === 'register';
  const submitLabel = useMemo(
    () => (isRegister ? 'Create account' : 'Sign in'),
    [isRegister]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setError('');
    setMessage('');
  };

  const resetAuth = () => {
    setUser(null);
    setMessage('');
    setError('');
    setForm(initialForm);
    setActiveTab('login');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const email = form.email.trim();

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = isRegister
        ? {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email,
          password: form.password,
        }
        : {
          email,
          password: form.password,
        };

      const result = isRegister ? await register(payload) : await login(payload);

      setUser(result.user);
      setMessage(
        isRegister
          ? 'Account created successfully. Check your inbox to verify your email.'
          : 'Signed in successfully.'
      );
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setMessage('');

    const email = form.email.trim();

    if (!email) {
      setError('Enter your email address first.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await forgetPassword({ email });
      setMessage(
        'You will receive a password reset link shortly.'
      );
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <AuthSuccess user={user} message={message} onReset={resetAuth} />;
  }

  return (
    <main className="auth-shell">
      <AuthHero
        title="Real-time collaboration for modern teams."
        description="Bring tasks, boards, presence, and notifications together in one focused workspace."
        highlights={[
          { label: 'Live', value: 'Board updates' },
          { label: 'Team', value: 'Presence indicators' },
          { label: 'Fast', value: 'File sharing' },
        ]}
      />

      <section className="auth-card">
        <AuthTabs activeTab={activeTab} onChange={handleTabChange} />

        <AuthForm
          isRegister={isRegister}
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
          isSubmitting={isSubmitting}
          error={error}
          message={message}
          submitLabel={submitLabel}
        />

        <p className="auth-note">
          {isRegister
            ? 'Create your account to get started with your first workspace.'
            : 'Sign in with your workspace email.'}
        </p>

      </section>
    </main>
  );
}
