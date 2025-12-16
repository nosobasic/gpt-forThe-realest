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
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="message-attachment">
                {attachment.type === 'image' && (
                  <img 
                    src={`data:${attachment.mimeType};base64,${attachment.data}`}
                    alt={attachment.name || 'Attachment'}
                    className="message-attachment-image"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {message.content && (
          <div className="message-text">{message.content}</div>
        )}
      </div>
    </div>
  );
}

