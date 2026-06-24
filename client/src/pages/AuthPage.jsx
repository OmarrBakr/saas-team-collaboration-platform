import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { forgetPassword, login, register } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/auth/AuthForm';
import AuthHero from '../components/auth/AuthHero';
import AuthSuccessPanel from '../components/auth/AuthSuccessPanel';
import AuthTabs from '../components/auth/AuthTabs';
import '../styles/auth.css';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function AuthPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // After login, redirect to the page the user originally tried to visit
  // (stored by ProtectedRoute), or fall back to "/"
  const intendedPath = location.state?.from?.pathname ?? '/';

  const [activeTab, setActiveTab] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // When set, the card shows the email-verification confirmation view
  const [registeredEmail, setRegisteredEmail] = useState(null);
  // Holds the user object from the register response until they go to dashboard
  const [registeredUser, setRegisteredUser] = useState(null);

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

  const handleGoToDashboard = () => {
    setUser(registeredUser); // now push into context → ProtectedRoute lets them through
    navigate('/', { replace: true });
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
        : { email, password: form.password };

      const result = isRegister ? await register(payload) : await login(payload);

      if (isRegister) {
        // Don't call setUser yet — doing so would cause PublicRoute to
        // redirect before the confirmation panel can render.
        // Store the user locally; setUser is called in handleGoToDashboard.
        setRegisteredUser(result.user);
        setRegisteredEmail(email);
        setForm(initialForm);
      } else {
        setUser(result.user);
        navigate(intendedPath, { replace: true });
      }
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
      setMessage('You will receive a password reset link shortly.');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {registeredEmail ? (
          <AuthSuccessPanel
            pill="Check your inbox"
            title="You're all set!"
            description={
              <>
                Your account has been created. We sent a verification link to{' '}
                <strong>{registeredEmail}</strong> - open it whenever you're
                ready to verify your address.
              </>
            }
            actionLabel="Go to Dashboard"
            onAction={handleGoToDashboard}
          />
        ) : (
          <>
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
          </>
        )}
      </section>
    </main>
  );
}

