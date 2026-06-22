const tabs = [
  { id: 'login', label: 'Login' },
  { id: 'register', label: 'Register' },
];

export default function AuthTabs({ activeTab, onChange }) {
  return (
    <div className="tab-row" role="tablist" aria-label="Authentication mode">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? 'tab active' : 'tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
