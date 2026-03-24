import ParticipantCard from './ParticipantCard.jsx';
import './ParticipantArea.css';

export default function ParticipantArea({ participants, phase, you, ownerId }) {
  const revealed = phase === 'revealed';

  return (
    <div className="participant-area">
      {participants.map((p) => (
        <ParticipantCard
          key={p.id}
          displayName={p.displayName}
          hasVoted={p.hasVoted}
          vote={p.vote}
          revealed={revealed}
          isYou={p.id === you}
          isOwner={p.id === ownerId}
        />
      ))}
    </div>
  );
}
