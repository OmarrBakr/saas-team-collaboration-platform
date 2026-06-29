import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { acceptWorkspaceInvitation } from '../services/workspaces';
import AuthHero from '../components/auth/AuthHero';
import AuthSuccessPanel from '../components/auth/AuthSuccessPanel';
import '../styles/auth.css';

const getQueryValue = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
};

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [isAccepting, setIsAccepting] = useState(true);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const token = useMemo(() => getQueryValue('token'), []);
  const email = useMemo(() => getQueryValue('email'), []);

  useEffect(() => {
    const runAcceptance = async () => {
      if (!token || !email) {
        setError('Your invitation link is incomplete. Please ask for a new invite.');
        setIsAccepting(false);
        return;
      }

      try {
        const result = await acceptWorkspaceInvitation({ token, email });
        setWorkspaceId(result.workspaceId || '');
        setWorkspaceName(result.workspaceName || '');
        setIsComplete(true);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsAccepting(false);
      }
    };

    runAcceptance();
  }, [token, email]);

  return (
    <main className="auth-shell">
      <AuthHero
        title="Join your workspace."
        description="Use the invitation link from your inbox to confirm access and step into the workspace."
        highlights={[
          { label: 'Account', value: email || 'Your email' },
          { label: 'Step', value: 'Accept the invite' },
          { label: 'Result', value: 'Workspace access' },
        ]}
      />

      <section className="auth-card">
        {isComplete ? (
          <AuthSuccessPanel
            pill="Invitation accepted"
            title="You're in."
            description={
              workspaceName
                ? `You joined "${workspaceName}".`
                : 'You can now open the workspace from your dashboard.'
            }
            actionLabel="Open Workspace"
            onAction={() => navigate(workspaceId ? `/workspaces/${workspaceId}` : '/')}
          />
        ) : isAccepting ? (
          <AuthSuccessPanel
            pill="Accepting"
            title="Checking your invitation."
            description="Please wait while we add you to the workspace."
            actionLabel="Please wait..."
            disabled
          />
        ) : (
          <AuthSuccessPanel
            pill="Invitation failed"
            pillVariant ='error'
            title="We couldn't accept that invite."
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
