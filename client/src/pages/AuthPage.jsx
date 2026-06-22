import { useMemo, useState } from 'react';

import { login, register } from '../services/auth';
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

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

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
    setIsSubmitting(true);

    try {
      const payload = isRegister
        ? {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            password: form.password,
          }
        : {
            email: form.email.trim(),
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
          isSubmitting={isSubmitting}
          error={error}
          message={message}
          submitLabel={submitLabel}
        />

        <p className="auth-note">
          {isRegister
            ? 'Create your account to get started with your first workspace.'
            : 'Use your workspace email to access your boards.'}
        </p>
      </section>
    </main>
  );
}
