import './ParticipantCard.css';

export default function ParticipantCard({
  displayName,
  hasVoted,
  vote,
  revealed,
  isYou,
  isOwner,
}) {
  return (
    <div className={`participant-card ${isYou ? 'participant-card--you' : ''}`}>
      <div className={`card-flip ${revealed ? 'card-flip--revealed' : ''}`}>
        <div className="card-face card-front">
          <div className="card-vote-indicator">
            {hasVoted && <span className="voted-check" aria-label="voted" />}
          </div>
        </div>
        <div className="card-face card-back">
          <span className="card-vote-value">{vote ?? '-'}</span>
        </div>
      </div>
      <div className="card-name">
        {displayName}
        {isOwner && <span className="owner-badge">Host</span>}
      </div>
    </div>
  );
}
