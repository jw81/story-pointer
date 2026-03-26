import { useState, useEffect } from 'react';
import './TicketUrl.css';

export default function TicketUrl({ ticketUrl, isOwner, onSet }) {
  const [draft, setDraft] = useState(ticketUrl ?? '');

  useEffect(() => {
    setDraft(ticketUrl ?? '');
  }, [ticketUrl]);

  function submit() {
    if (draft !== (ticketUrl ?? '')) {
      onSet(draft);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  }

  if (isOwner) {
    return (
      <div className="ticket-url-bar">
        <span className="ticket-url-label">Ticket:</span>
        <input
          className="ticket-url-input"
          type="url"
          value={draft}
          placeholder="Paste ticket URL..."
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  if (!ticketUrl) return null;

  return (
    <div className="ticket-url-bar">
      <span className="ticket-url-label">Ticket:</span>
      <a
        className="ticket-url-link"
        href={ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ticketUrl}
      </a>
    </div>
  );
}
