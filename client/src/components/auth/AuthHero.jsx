export default function AuthHero({ title, description, highlights }) {
  return (
    <section className="auth-visual">
      <div className="brand-badge">Flowvia</div>
      <h1>{title}</h1>
      <p>{description}</p>

      <div className="feature-grid">
        {highlights.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
