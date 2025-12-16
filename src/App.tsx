import { useState } from 'react';
import { sendMessage } from './utils/api';
import type { Message as MessageType } from './utils/api';
import ChatWindow from './components/ChatWindow';
import InputBox from './components/InputBox';
import './App.css';

/**
 * Main App Component
 * Manages conversation state and handles message sending
 */
function App() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles sending a user message and receiving assistant response
   */
  const handleSendMessage = async (userMessage: string) => {
    // Add user message to conversation
    const userMsg: MessageType = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      // Send all messages to maintain conversation context
      const assistantResponse = await sendMessage(updatedMessages);
      
      // Add assistant response to conversation
      const assistantMsg: MessageType = { 
        role: 'assistant', 
        content: assistantResponse 
      };
      setMessages([...updatedMessages, assistantMsg]);
    } catch (err) {
      // Handle errors gracefully
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Optionally, you could add an error message to the chat
      console.error('Error sending message:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>gpt Real Niggas</h1>
        {error && (
          <div className="error-banner">
            Error: {error}
          </div>
        )}
      </header>
      
      <main className="app-main">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <InputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
