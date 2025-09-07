import * as flatbuffers from 'flatbuffers';
import { Message } from './generated/sigma-sockets/message';
import { MessageType } from './generated/sigma-sockets/message-type';
import { ConnectMessage } from './generated/sigma-sockets/connect-message';
import { DataMessage } from './generated/sigma-sockets/data-message';
import { HeartbeatMessage } from './generated/sigma-sockets/heartbeat-message';
import { ReconnectMessage } from './generated/sigma-sockets/reconnect-message';
import { DisconnectMessage } from './generated/sigma-sockets/disconnect-message';
import { ErrorMessage } from './generated/sigma-sockets/error-message';

// Security constants
const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB
const MAX_PAYLOAD_SIZE = 32 * 1024; // 32KB
const MAX_STRING_LENGTH = 1024; // 1KB
const MAX_SESSION_ID_LENGTH = 128;
const MAX_REASON_LENGTH = 256;
const MAX_CLIENT_VERSION_LENGTH = 64;

// Rate limiting constants
const MAX_MESSAGES_PER_SECOND = 100;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedData?: Buffer;
}

export class MessageValidator {
  private static readonly messageCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Validates a WebSocket message for security and structure
   */
  static validateMessage(data: Buffer, clientId: string): ValidationResult {
    try {
      // Check message size
      if (data.length === 0) {
        return { isValid: false, error: 'Empty message' };
      }

      if (data.length > MAX_MESSAGE_SIZE) {
        return { isValid: false, error: 'Message too large' };
      }

      // Skip rate limiting for development/chat demo
      if (process.env['NODE_ENV'] === 'production') {
        if (!this.checkRateLimit(clientId)) {
          return { isValid: false, error: 'Rate limit exceeded' };
        }
      }

      // Validate FlatBuffers structure
      const buffer = new Uint8Array(data);
      const buf = new flatbuffers.ByteBuffer(buffer);
      
      if (!buf) {
        return { isValid: false, error: 'Invalid buffer' };
      }

      const message = Message.getRootAsMessage(buf);
      
      if (!message) {
        return { isValid: false, error: 'Invalid message structure' };
      }

      // Validate message type
      const messageType = message.type();
      if (!Object.values(MessageType).includes(messageType)) {
        return { isValid: false, error: 'Invalid message type' };
      }

      // Validate message data based on type
      const dataValidation = this.validateMessageData(message);
      if (!dataValidation.isValid) {
        return dataValidation;
      }

      // Sanitize and return validated data
      return {
        isValid: true,
        sanitizedData: data
      };

    } catch (error) {
      return { 
        isValid: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validates message data based on message type
   */
  private static validateMessageData(message: Message): ValidationResult {
    switch (message.type()) {
      case MessageType.Connect:
        return this.validateConnectMessage(message);
      case MessageType.Data:
        return this.validateDataMessage(message);
      case MessageType.Heartbeat:
        return this.validateHeartbeatMessage(message);
      case MessageType.Reconnect:
        return this.validateReconnectMessage(message);
      case MessageType.Disconnect:
        return this.validateDisconnectMessage(message);
      case MessageType.Error:
        return this.validateErrorMessage(message);
      default:
        return { isValid: false, error: 'Unknown message type' };
    }
  }

  /**
   * Validates ConnectMessage
   */
  private static validateConnectMessage(message: Message): ValidationResult {
    const connectMsg = message.data(new ConnectMessage());
    
    if (!connectMsg) {
      return { isValid: false, error: 'Invalid connect message data' };
    }

    // Validate session ID
    const sessionId = connectMsg.sessionId();
    if (!sessionId) {
      return { isValid: false, error: 'Missing session ID' };
    }

    if (sessionId.length > MAX_SESSION_ID_LENGTH) {
      return { isValid: false, error: 'Session ID too long' };
    }

    if (!this.isValidSessionId(sessionId)) {
      return { isValid: false, error: 'Invalid session ID format' };
    }

    // Validate client version
    const clientVersion = connectMsg.clientVersion();
    if (clientVersion && clientVersion.length > MAX_CLIENT_VERSION_LENGTH) {
      return { isValid: false, error: 'Client version too long' };
    }

    return { isValid: true };
  }

  /**
   * Validates DataMessage
   */
  private static validateDataMessage(message: Message): ValidationResult {
    const dataMsg = message.data(new DataMessage());
    
    if (!dataMsg) {
      return { isValid: false, error: 'Invalid data message' };
    }

    // Validate payload
    const payload = dataMsg.payloadArray();
    if (!payload) {
      return { isValid: false, error: 'Missing payload' };
    }

    if (payload.length > MAX_PAYLOAD_SIZE) {
      return { isValid: false, error: 'Payload too large' };
    }

    // Validate message ID
    const messageId = dataMsg.messageId();
    if (messageId === undefined || messageId === null) {
      return { isValid: false, error: 'Missing message ID' };
    }

    // Validate timestamp
    const timestamp = dataMsg.timestamp();
    if (timestamp === undefined || timestamp === null) {
      return { isValid: false, error: 'Missing timestamp' };
    }

    // Check timestamp is not too far in the future or past
    const now = Date.now();
    const messageTime = Number(timestamp);
    const timeDiff = Math.abs(now - messageTime);
    
    if (timeDiff > 300000) { // 5 minutes
      return { isValid: false, error: 'Invalid timestamp' };
    }

    return { isValid: true };
  }

  /**
   * Validates HeartbeatMessage
   */
  private static validateHeartbeatMessage(message: Message): ValidationResult {
    const heartbeatMsg = message.data(new HeartbeatMessage());
    
    if (!heartbeatMsg) {
      return { isValid: false, error: 'Invalid heartbeat message' };
    }

    // Validate timestamp
    const timestamp = heartbeatMsg.timestamp();
    if (timestamp === undefined || timestamp === null) {
      return { isValid: false, error: 'Missing timestamp' };
    }

    // Check timestamp is reasonable
    const now = Date.now();
    const messageTime = Number(timestamp);
    const timeDiff = Math.abs(now - messageTime);
    
    if (timeDiff > 60000) { // 1 minute
      return { isValid: false, error: 'Invalid heartbeat timestamp' };
    }

    return { isValid: true };
  }

  /**
   * Validates ReconnectMessage
   */
  private static validateReconnectMessage(message: Message): ValidationResult {
    const reconnectMsg = message.data(new ReconnectMessage());
    
    if (!reconnectMsg) {
      return { isValid: false, error: 'Invalid reconnect message' };
    }

    // Validate session ID
    const sessionId = reconnectMsg.sessionId();
    if (!sessionId) {
      return { isValid: false, error: 'Missing session ID' };
    }

    if (sessionId.length > MAX_SESSION_ID_LENGTH) {
      return { isValid: false, error: 'Session ID too long' };
    }

    if (!this.isValidSessionId(sessionId)) {
      return { isValid: false, error: 'Invalid session ID format' };
    }

    // Validate last message ID
    const lastMessageId = reconnectMsg.lastMessageId();
    if (lastMessageId === undefined || lastMessageId === null) {
      return { isValid: false, error: 'Missing last message ID' };
    }

    return { isValid: true };
  }

  /**
   * Validates DisconnectMessage
   */
  private static validateDisconnectMessage(message: Message): ValidationResult {
    const disconnectMsg = message.data(new DisconnectMessage());
    
    if (!disconnectMsg) {
      return { isValid: false, error: 'Invalid disconnect message' };
    }

    // Validate reason (optional but if present, should be reasonable length)
    const reason = disconnectMsg.reason();
    if (reason && reason.length > MAX_REASON_LENGTH) {
      return { isValid: false, error: 'Disconnect reason too long' };
    }

    return { isValid: true };
  }

  /**
   * Validates ErrorMessage
   */
  private static validateErrorMessage(message: Message): ValidationResult {
    const errorMsg = message.data(new ErrorMessage());
    
    if (!errorMsg) {
      return { isValid: false, error: 'Invalid error message' };
    }

    // Validate error code
    const code = errorMsg.code();
    if (code === undefined || code === null) {
      return { isValid: false, error: 'Missing error code' };
    }

    // Validate error message
    const errorMessage = errorMsg.message();
    if (!errorMessage) {
      return { isValid: false, error: 'Missing error message' };
    }

    if (errorMessage.length > MAX_STRING_LENGTH) {
      return { isValid: false, error: 'Error message too long' };
    }

    return { isValid: true };
  }

  /**
   * Validates session ID format
   */
  private static isValidSessionId(sessionId: string): boolean {
    // Session ID should be alphanumeric with hyphens and underscores
    const sessionIdRegex = /^[a-zA-Z0-9_-]+$/;
    return sessionIdRegex.test(sessionId);
  }

  /**
   * Checks rate limiting for a client
   */
  private static checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientData = this.messageCounts.get(clientId);

    if (!clientData) {
      this.messageCounts.set(clientId, { count: 1, resetTime: now + 1000 });
      return true;
    }

    // Reset counter if time window has passed
    if (now > clientData.resetTime) {
      this.messageCounts.set(clientId, { count: 1, resetTime: now + 1000 });
      return true;
    }

    // Check if within rate limit
    if (clientData.count >= MAX_MESSAGES_PER_SECOND) {
      return false;
    }

    // Increment counter
    clientData.count++;
    return true;
  }

  /**
   * Sanitizes string input to prevent injection attacks
   */
  static sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .substring(0, MAX_STRING_LENGTH) // Limit length
      .trim();
  }

  /**
   * Validates and sanitizes session ID
   */
  static sanitizeSessionId(sessionId: string): string {
    if (!sessionId) return '';
    
    return sessionId
      .replace(/[^a-zA-Z0-9_-]/g, '') // Keep only valid characters
      .substring(0, MAX_SESSION_ID_LENGTH) // Limit length
      .trim();
  }

  /**
   * Cleans up old rate limiting data
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    for (const [clientId, data] of this.messageCounts.entries()) {
      if (now > data.resetTime + 60000) { // Clean up after 1 minute
        this.messageCounts.delete(clientId);
      }
    }
  }
}
