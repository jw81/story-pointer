import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipantCard from './ParticipantCard.jsx';

describe('ParticipantCard', () => {
  it('shows display name', () => {
    render(
      <ParticipantCard
        displayName="Dev 1"
        hasVoted={false}
        vote={null}
        revealed={false}
        isYou={false}
        isOwner={false}
      />,
    );
    expect(screen.getByText('Dev 1')).toBeInTheDocument();
  });

  it('shows checkmark when voted and not revealed', () => {
    render(
      <ParticipantCard
        displayName="Dev"
        hasVoted={true}
        vote={null}
        revealed={false}
        isYou={false}
        isOwner={false}
      />,
    );
    expect(screen.getByLabelText('voted')).toBeInTheDocument();
  });

  it('does not show checkmark when not voted', () => {
    render(
      <ParticipantCard
        displayName="Dev"
        hasVoted={false}
        vote={null}
        revealed={false}
        isYou={false}
        isOwner={false}
      />,
    );
    expect(screen.queryByLabelText('voted')).not.toBeInTheDocument();
  });

  it('shows vote value when revealed', () => {
    render(
      <ParticipantCard
        displayName="Dev"
        hasVoted={true}
        vote="5"
        revealed={true}
        isYou={false}
        isOwner={false}
      />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows host badge for owner', () => {
    render(
      <ParticipantCard
        displayName="Product"
        hasVoted={false}
        vote={null}
        revealed={false}
        isYou={false}
        isOwner={true}
      />,
    );
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('applies you styling', () => {
    const { container } = render(
      <ParticipantCard
        displayName="Dev"
        hasVoted={false}
        vote={null}
        revealed={false}
        isYou={true}
        isOwner={false}
      />,
    );
    expect(container.querySelector('.participant-card--you')).toBeTruthy();
  });
});
