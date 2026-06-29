export default function AuthSuccessPanel({
  pill,
  pillVariant = 'success',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  actionType = 'button',
  disabled = false,
}) {
  return (
    <div className="success-card">
      <div className={`success-pill ${pillVariant === 'error' ? 'success-pill--error' : ''}`}>{pill}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionType === 'link' ? (
        <a className="primary-btn" href={actionHref}>
          {actionLabel}
        </a>
      ) : (
        <button
          type="button"
          className="primary-btn"
          onClick={onAction}
          disabled={disabled}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
