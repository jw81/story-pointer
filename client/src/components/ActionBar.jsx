import './ActionBar.css';

export default function ActionBar({ isOwner, phase, onReveal, onReset }) {
  if (!isOwner) {
    return (
      <div className="action-bar">
        <span className="action-waiting">
          {phase === 'voting'
            ? 'Waiting for host to reveal...'
            : 'Waiting for host to start new round...'}
        </span>
      </div>
    );
  }

  return (
    <div className="action-bar">
      {phase === 'voting' ? (
        <button className="action-btn action-btn--reveal" onClick={onReveal}>
          Reveal Votes
        </button>
      ) : (
        <button className="action-btn action-btn--reset" onClick={onReset}>
          New Round
        </button>
      )}
    </div>
  );
}
