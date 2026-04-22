import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoomPage from './RoomPage.jsx';

vi.mock('../socket.js', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  },
}));

import socket from '../socket.js';

function renderRoomPage(roomId = 'test1234') {
  return render(
    <MemoryRouter initialEntries={[`/room/${roomId}`]}>
      <Routes>
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn();
});

describe('RoomPage', () => {
  it('shows role selector after room check', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true });

    renderRoomPage();

    await waitFor(() => {
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    });
  });

  it('redirects when room does not exist', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false });

    renderRoomPage();

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('connects socket on role selection', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true });

    renderRoomPage();

    await waitFor(() => {
      expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Dev'));

    expect(socket.connect).toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('room:join', {
      roomId: 'test1234',
      role: 'Dev',
      isLurker: false,
    });
  });
});
