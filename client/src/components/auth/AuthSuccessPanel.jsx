export default function AuthSuccessPanel({
  pill,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  actionType = 'button',
}) {
  return (
    <div className="success-card">
      <div className="success-pill">{pill}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionType === 'link' ? (
        <a className="primary-btn" href={actionHref}>
          {actionLabel}
        </a>
      ) : (
        <button type="button" className="primary-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
