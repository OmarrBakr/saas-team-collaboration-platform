export default function DashboardTopBar({ title, description }) {
  return (
    <header className="dashboard-topbar">
      <div>
        <p className="dashboard-kicker">Workspace home</p>
        <h1>{title}</h1>
        <p className="dashboard-intro">{description}</p>
      </div>

    </header>
  );
}
