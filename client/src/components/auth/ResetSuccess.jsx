export default function ResetSuccess({ message }) {
  return (
    <div className="success-card">
      <div className="success-pill">Reset complete</div>
      <h2>Password updated.</h2>
      <p>{message}</p>
      <a className="primary-btn" href="/">
        Go to sign in
      </a>
    </div>
  );
}
