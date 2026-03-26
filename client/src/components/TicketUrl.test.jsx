import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TicketUrl from './TicketUrl.jsx';

describe('TicketUrl — owner view', () => {
  it('renders an input with placeholder when no URL is set', () => {
    render(<TicketUrl ticketUrl={null} isOwner={true} onSet={() => {}} />);
    const input = screen.getByPlaceholderText('Paste ticket URL...');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('pre-fills the input when a URL is set', () => {
    render(
      <TicketUrl
        ticketUrl="https://example.com/ticket/1"
        isOwner={true}
        onSet={() => {}}
      />,
    );
    expect(
      screen.getByDisplayValue('https://example.com/ticket/1'),
    ).toBeInTheDocument();
  });

  it('calls onSet with the value when Enter is pressed', async () => {
    const onSet = vi.fn();
    render(<TicketUrl ticketUrl={null} isOwner={true} onSet={onSet} />);
    const input = screen.getByPlaceholderText('Paste ticket URL...');
    await userEvent.type(input, 'https://example.com/ticket/2{Enter}');
    expect(onSet).toHaveBeenCalledWith('https://example.com/ticket/2');
  });

  it('calls onSet with the value when the input is blurred', async () => {
    const onSet = vi.fn();
    render(<TicketUrl ticketUrl={null} isOwner={true} onSet={onSet} />);
    const input = screen.getByPlaceholderText('Paste ticket URL...');
    await userEvent.type(input, 'https://example.com/ticket/3');
    await userEvent.tab();
    expect(onSet).toHaveBeenCalledWith('https://example.com/ticket/3');
  });

  it('calls onSet with empty string when URL is cleared and blurred', async () => {
    const onSet = vi.fn();
    render(
      <TicketUrl
        ticketUrl="https://example.com/ticket/1"
        isOwner={true}
        onSet={onSet}
      />,
    );
    const input = screen.getByDisplayValue('https://example.com/ticket/1');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onSet).toHaveBeenCalledWith('');
  });

  it('does not call onSet when the value has not changed', async () => {
    const onSet = vi.fn();
    render(
      <TicketUrl
        ticketUrl="https://example.com/ticket/1"
        isOwner={true}
        onSet={onSet}
      />,
    );
    screen.getByDisplayValue('https://example.com/ticket/1').focus();
    await userEvent.tab();
    expect(onSet).not.toHaveBeenCalled();
  });
});

describe('TicketUrl — non-owner view', () => {
  it('renders a link when a URL is set', () => {
    render(
      <TicketUrl
        ticketUrl="https://example.com/ticket/1"
        isOwner={false}
        onSet={() => {}}
      />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/ticket/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing when no URL is set', () => {
    const { container } = render(
      <TicketUrl ticketUrl={null} isOwner={false} onSet={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
