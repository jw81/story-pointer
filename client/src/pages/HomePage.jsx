import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      const { roomId } = await res.json();
      navigate(`/room/${roomId}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-title">Story Pointer</h1>
        <p className="home-subtitle">
          Real-time story pointing for agile teams
        </p>
        <button
          className="create-room-btn"
          onClick={createRoom}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create a Room'}
        </button>
      </div>
    </div>
  );
}
