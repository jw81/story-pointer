import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VotingCards from './VotingCards.jsx';

describe('VotingCards', () => {
  it('renders all vote values', () => {
    render(<VotingCards selected={null} onVote={() => {}} disabled={false} />);
    ['1', '2', '3', '5', '8', '?'].forEach((v) => {
      expect(screen.getByText(v)).toBeInTheDocument();
    });
  });

  it('highlights the selected card', () => {
    render(<VotingCards selected="5" onVote={() => {}} disabled={false} />);
    expect(screen.getByText('5')).toHaveClass('vote-card--selected');
    expect(screen.getByText('3')).not.toHaveClass('vote-card--selected');
  });

  it('calls onVote when a card is clicked', async () => {
    const onVote = vi.fn();
    render(<VotingCards selected={null} onVote={onVote} disabled={false} />);
    await userEvent.click(screen.getByText('8'));
    expect(onVote).toHaveBeenCalledWith('8');
  });

  it('disables cards when disabled prop is true', () => {
    render(<VotingCards selected={null} onVote={() => {}} disabled={true} />);
    expect(screen.getByText('5')).toBeDisabled();
  });
});
