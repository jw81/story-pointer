import { useState } from 'react';
import './Header.css';

export default function Header({ roomId, isOwner }) {
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
        <button
          className={isOwner ? 'copy-btn copy-btn--pulse' : 'copy-btn'}
          onClick={copyLink}
        >
          {copied ? 'Copied!' : 'Copy Room Link'}
        </button>
      </div>
    </header>
  );
}
