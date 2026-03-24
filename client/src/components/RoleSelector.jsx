import './RoleSelector.css';

const ROLES = ['Dev', 'Product', 'UX', 'Other'];

export default function RoleSelector({ onSelect }) {
  return (
    <div className="role-overlay">
      <div className="role-modal">
        <h2 className="role-title">Choose Your Role</h2>
        <div className="role-options">
          {ROLES.map((role) => (
            <button
              key={role}
              className="role-btn"
              onClick={() => onSelect(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
