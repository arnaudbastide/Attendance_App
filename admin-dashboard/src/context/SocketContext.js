// admin-dashboard/src/context/SocketContext.js - WebSocket context for real-time updates
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Initialize socket connection
      const newSocket = io('/', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected');

        // Join user room for personal updates
        newSocket.emit('join_room', user.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  const subscribeToAttendanceUpdates = (callback) => {
    if (socket) {
      socket.on('new_attendance', callback);
      return () => socket.off('new_attendance', callback);
    }
  };

  const subscribeToLeaveRequests = (callback) => {
    if (socket) {
      socket.on('new_leave_request', callback);
      return () => socket.off('new_leave_request', callback);
    }
  };

  const emitAttendanceUpdate = (data) => {
    if (socket) {
      socket.emit('attendance_update', data);
    }
  };

  const emitLeaveRequest = (data) => {
    if (socket) {
      socket.emit('leave_request', data);
    }
  };

  const value = {
    socket,
    isConnected,
    subscribeToAttendanceUpdates,
    subscribeToLeaveRequests,
    emitAttendanceUpdate,
    emitLeaveRequest
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};