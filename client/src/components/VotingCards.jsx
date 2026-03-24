import './VotingCards.css';

const VALUES = ['1', '2', '3', '5', '8', '?'];

export default function VotingCards({ selected, onVote, disabled }) {
  return (
    <div className="voting-cards">
      {VALUES.map((value) => (
        <button
          key={value}
          className={`vote-card ${selected === value ? 'vote-card--selected' : ''}`}
          onClick={() => onVote(value)}
          disabled={disabled}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
