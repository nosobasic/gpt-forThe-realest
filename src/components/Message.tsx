import type { Message as MessageType } from '../utils/api';

interface MessageProps {
  message: MessageType;
}

/**
 * Message Component
 * Displays individual messages with different styling for user and assistant
 */
export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-content">
        <div className="message-role">{isUser ? 'You' : 'Assistant'}</div>
        <div className="message-text">{message.content}</div>
      </div>
    </div>
  );
}

