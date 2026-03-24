import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockClear();
  globalThis.fetch = vi.fn();
});

describe('HomePage', () => {
  it('renders the create room button', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', { name: /create a room/i }),
    ).toBeInTheDocument();
  });

  it('creates a room and navigates on click', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ roomId: 'abc12345' }),
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /create a room/i }),
    );

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/rooms', {
      method: 'POST',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/room/abc12345');
  });
});
