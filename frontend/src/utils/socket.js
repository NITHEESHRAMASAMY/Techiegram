import { io } from 'socket.io-client';

let socket = null;

export const initiateSocket = (token) => {
  if (socket) return socket;

  const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin;

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
