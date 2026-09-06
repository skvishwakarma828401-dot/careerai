import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentInterviewId = null;
  }

  /**
   * Connect to Socket.IO server with credentials
   */
  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log(`[SocketService] Connected to real-time server (Socket ID: ${this.socket.id})`);
      if (this.currentInterviewId) {
        this.joinInterview(this.currentInterviewId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[SocketService] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`[SocketService] Connection error: ${error.message}`);
    });

    return this.socket;
  }

  /**
   * Join an authenticated interview room
   * @param {string} interviewId
   */
  joinInterview(interviewId) {
    this.currentInterviewId = interviewId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinInterview', { interviewId });
    }
  }

  /**
   * Start the mock interview
   * @param {string} interviewId
   */
  startInterview(interviewId) {
    if (this.socket) {
      this.socket.emit('startInterview', { interviewId });
    }
  }

  /**
   * Submit candidate answer for real-time evaluation
   * @param {Object} payload
   * @param {string} payload.interviewId
   * @param {number|string} payload.questionId
   * @param {string} payload.userAnswer
   */
  submitAnswer({ interviewId, questionId, userAnswer }) {
    if (this.socket) {
      this.socket.emit('submitAnswer', { interviewId, questionId, userAnswer });
    }
  }

  /**
   * Pause interview timer
   * @param {string} interviewId
   * @param {number} elapsedSeconds
   */
  pauseInterview(interviewId, elapsedSeconds) {
    if (this.socket) {
      this.socket.emit('pauseInterview', { interviewId, elapsedSeconds });
    }
  }

  /**
   * Resume interview timer
   * @param {string} interviewId
   */
  resumeInterview(interviewId) {
    if (this.socket) {
      this.socket.emit('resumeInterview', { interviewId });
    }
  }

  /**
   * End interview session early
   * @param {string} interviewId
   */
  endInterview(interviewId) {
    if (this.socket) {
      this.socket.emit('endInterview', { interviewId });
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentInterviewId = null;
    }
  }
}

export default new SocketService();
