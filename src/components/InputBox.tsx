import { useState } from 'react';
import type { FormEvent } from 'react';

interface InputBoxProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

/**
 * InputBox Component
 * Handles user input and message sending
 */
export default function InputBox({ onSendMessage, isLoading }: InputBoxProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput && !isLoading) {
      onSendMessage(trimmedInput);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter to submit, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (trimmedInput && !isLoading) {
        onSendMessage(trimmedInput);
        setInput('');
      }
    }
  };

  return (
    <div className="input-box-container">
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
          disabled={isLoading}
          rows={1}
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

