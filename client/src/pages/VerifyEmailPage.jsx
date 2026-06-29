import { useEffect, useMemo, useState } from 'react';

import { verifyEmail } from '../services/auth';
import AuthHero from '../components/auth/AuthHero';
import AuthSuccessPanel from '../components/auth/AuthSuccessPanel';
import '../styles/auth.css';

const getQueryValue = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
};

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const token = useMemo(() => getQueryValue('token'), []);
  const email = useMemo(() => getQueryValue('email'), []);

  useEffect(() => {
    const runVerification = async () => {
      if (!token || !email) {
        setError('Your verification link is incomplete. Please request a new one.');
        setIsVerifying(false);
        return;
      }

      try {
        await verifyEmail({ token, email });
        setIsComplete(true);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsVerifying(false);
      }
    };

    runVerification();
  }, [token, email]);

  return (
    <main className="auth-shell">
      <AuthHero
        title="Confirm your email address."
        description="Use the link from your inbox to confirm this account's email address."
        highlights={[
          { label: 'Account', value: email || 'Your email' },
          { label: 'Step', value: 'Confirm the link' },
          { label: 'Result', value: 'Email verified' },
        ]}
      />

      <section className="auth-card">
        {isComplete ? (
          <AuthSuccessPanel
            pill="Verification complete"
            title="Email confirmed."
            description="Your address is now confirmed. You can return to the dashboard."
            actionLabel="Go to Dashboard"
            actionType="link"
            actionHref="/"
          />
        ) : isVerifying ? (
          <AuthSuccessPanel
            pill="Verifying"
            title="Checking your link."
            description="Please wait while we confirm your email address."
            actionLabel="Please wait..."
            disabled
          />
        ) : (
          <AuthSuccessPanel
            pill="Verification failed"
            pillVariant ='error'
            title="We couldn't verify that link."
            description={error}
            actionLabel="Go to Dashboard"
            actionType="link"
            actionHref="/"
          />
        )}
      </section>
    </main>
  );
}
