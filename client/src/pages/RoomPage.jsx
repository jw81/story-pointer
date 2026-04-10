import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRoom from '../hooks/useRoom.js';
import Header from '../components/Header.jsx';
import RoleSelector from '../components/RoleSelector.jsx';
import TicketUrl from '../components/TicketUrl.jsx';
import VotingCards from '../components/VotingCards.jsx';
import ParticipantArea from '../components/ParticipantArea.jsx';
import ActionBar from '../components/ActionBar.jsx';
import './RoomPage.css';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const {
    roomState,
    error,
    joined,
    isOwner,
    join,
    castVote,
    reveal,
    reset,
    setTicketUrl,
  } = useRoom(roomId);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((res) => {
        if (!res.ok) navigate('/', { replace: true });
        else setChecking(false);
      })
      .catch(() => navigate('/', { replace: true }));
  }, [roomId, navigate]);

  if (checking) {
    return (
      <div className="room-loading">
        <p>Loading room...</p>
      </div>
    );
  }

  if (!joined) {
    return <RoleSelector onSelect={join} />;
  }

  if (!roomState) {
    return (
      <div className="room-loading">
        <p>Connecting...</p>
      </div>
    );
  }

  const myParticipant = roomState.participants.find(
    (p) => p.id === roomState.you,
  );

  return (
    <div className="room-page">
      <Header roomId={roomId} isOwner={isOwner} />
      <TicketUrl
        ticketUrl={roomState.ticketUrl}
        isOwner={isOwner}
        onSet={setTicketUrl}
      />
      {error && <div className="room-error">{error}</div>}
      <VotingCards
        selected={myParticipant?.vote}
        onVote={castVote}
        disabled={roomState.phase === 'revealed'}
      />
      <ParticipantArea
        participants={roomState.participants}
        phase={roomState.phase}
        you={roomState.you}
        ownerId={roomState.ownerId}
      />
      <ActionBar
        isOwner={isOwner}
        phase={roomState.phase}
        onReveal={reveal}
        onReset={reset}
      />
    </div>
  );
}
