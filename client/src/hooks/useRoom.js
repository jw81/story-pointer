import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket.js';

export default function useRoom(roomId) {
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    function onState(state) {
      setRoomState(state);
      setError(null);
    }

    function onError({ message }) {
      setError(message);
    }

    socket.on('room:state', onState);
    socket.on('room:error', onError);

    return () => {
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      if (socket.connected) {
        socket.disconnect();
      }
      setJoined(false);
      setRoomState(null);
    };
  }, [roomId]);

  const join = useCallback(
    (role) => {
      socket.connect();
      socket.emit('room:join', { roomId, role });
      setJoined(true);
    },
    [roomId],
  );

  const castVote = useCallback((value) => {
    socket.emit('vote:cast', { roomId: roomIdRef.current, value });
  }, []);

  const reveal = useCallback(() => {
    socket.emit('vote:reveal', { roomId: roomIdRef.current });
  }, []);

  const reset = useCallback(() => {
    socket.emit('room:reset', { roomId: roomIdRef.current });
  }, []);

  const setTicketUrl = useCallback((url) => {
    socket.emit('ticket:set', { roomId: roomIdRef.current, url });
  }, []);

  const isOwner = roomState?.ownerId === roomState?.you;

  return {
    roomState,
    error,
    joined,
    isOwner,
    join,
    castVote,
    reveal,
    reset,
    setTicketUrl,
  };
}
