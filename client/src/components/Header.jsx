import { useState } from 'react';
import './Header.css';

export default function Header({ roomId }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="header">
      <h1 className="header-title">Story Pointer</h1>
      <div className="header-room">
        <span className="room-id">Room: {roomId}</span>
        <button className="copy-btn" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </header>
  );
}
