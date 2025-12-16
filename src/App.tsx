import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { sendMessage } from './utils/api';
import type { Message as MessageType, Attachment } from './utils/api';
import ChatWindow from './components/ChatWindow';
import InputBox from './components/InputBox';
import Navbar from './components/Navbar';
import Home from './components/Home';
import './App.css';

/**
 * Main App Component
 * Manages conversation state, authentication, and handles message sending
 */
function App() {
  const { isSignedIn, isLoaded } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear messages when user signs out
   */
  useEffect(() => {
    if (!isSignedIn) {
      setMessages([]);
      setError(null);
    }
  }, [isSignedIn]);

  /**
   * Handles sending a user message and receiving assistant response
   */
  const handleSendMessage = async (userMessage: string, attachments?: Attachment[]) => {
    // Add user message to conversation
    const userMsg: MessageType = { 
      role: 'user', 
      content: userMessage,
      attachments: attachments,
    };
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

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="app">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      
      {!isSignedIn ? (
        <Home />
      ) : (
        <>
          {error && (
            <div className="error-banner">
              Error: {error}
            </div>
          )}
          <main className="app-main">
            <ChatWindow messages={messages} isLoading={isLoading} />
            <InputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
