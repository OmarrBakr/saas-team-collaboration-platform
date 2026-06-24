import AuthSuccessPanel from './AuthSuccessPanel';

export default function ResetSuccess({ message }) {
  return (
    <AuthSuccessPanel
      pill="Reset complete"
      title="Password updated."
      description={message}
      actionLabel="Go to sign in"
      actionType="link"
      actionHref="/"
    />
  );
}
