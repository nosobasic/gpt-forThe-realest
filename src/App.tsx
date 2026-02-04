import { useState, useEffect, useCallback, useRef } from 'react';

const POSITIVE_AFFIRMATIONS = [
  "You are capable of amazing things!",
  "Every day is a fresh start!",
  "You have the power to create change!",
  "Believe in yourself - you've got this!",
  "Your potential is limitless!",
  "You are stronger than you know!",
  "Great things are coming your way!",
  "You deserve happiness and success!",
  "Your dreams are within reach!",
  "You are worthy of all good things!",
  "Keep going - you're doing great!",
  "You radiate positivity and light!",
  "You are exactly where you need to be!",
  "Your efforts are making a difference!",
  "You bring joy to those around you!",
];
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  listConversations, 
  createConversation, 
  getConversation, 
  deleteConversation,
  sendMessageToConversationStream,
  listMemories,
  deleteMemory,
} from './utils/api';
import type { Message as MessageType, Conversation, Memory, Attachment } from './utils/api';
import ChatWindow from './components/ChatWindow';
import InputBox from './components/InputBox';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import './App.css';

function App() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userId = user?.id || '';
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<MessageType[]>(messages);
  messagesRef.current = messages;
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  useEffect(() => {
    if (!currentConversationId && messages.length === 0) {
      const interval = setInterval(() => {
        setAffirmationIndex((prev) => (prev + 1) % POSITIVE_AFFIRMATIONS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentConversationId, messages.length]);

  const closeSidebar = () => {
    if (window.innerWidth <= 480) {
      setSidebarOpen(false);
    }
  };

  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const convs = await listConversations(userId);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [userId]);

  const loadMemories = useCallback(async () => {
    if (!userId) return;
    try {
      const mems = await listMemories(userId);
      setMemories(mems);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (isSignedIn && userId) {
      loadConversations();
      loadMemories();
    } else {
      setConversations([]);
      setMemories([]);
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [isSignedIn, userId, loadConversations, loadMemories]);

  const handleSelectConversation = async (id: number) => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const conv = await getConversation(userId, id);
      setCurrentConversationId(id);
      setMessages(conv.messages || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(async () => {
    if (!userId) return;
    try {
      const conv = await createConversation(userId);
      setConversations(prev => [conv, ...prev]);
      setCurrentConversationId(conv.id);
      setMessages([]);
      setError(null);
      focusInput();
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create new chat');
    }
  }, [userId, focusInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isSignedIn && !isLoading) {
          handleNewChat();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSignedIn, isLoading, handleNewChat]);

  const handleDeleteConversation = async (id: number) => {
    if (!userId) return;
    try {
      await deleteConversation(userId, id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleDeleteMemory = async (id: number) => {
    if (!userId) return;
    try {
      await deleteMemory(userId, id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleSendMessage = async (userMessage: string, attachments?: Attachment[]) => {
    if (!userId) return;
    
    let convId = currentConversationId;
    
    if (!convId) {
      try {
        const conv = await createConversation(userId);
        setConversations(prev => [conv, ...prev]);
        convId = conv.id;
        setCurrentConversationId(convId);
      } catch (err) {
        setError('Failed to create conversation');
        return;
      }
    }

    const userMsg: MessageType = { role: 'user', content: userMessage, attachments };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await sendMessageToConversationStream(userId, convId, userMessage, (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          const lastMessage = newMessages[lastIndex];
          if (lastMessage.role === 'assistant') {
            newMessages[lastIndex] = { ...lastMessage, content: lastMessage.content + chunk };
          }
          return newMessages;
        });
      }, attachments);
      
      loadConversations();
      setTimeout(() => loadMemories(), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error sending message:', errorMessage);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = useCallback(async () => {
    if (!userId || !currentConversationId || isLoading) return;
    
    const currentMessages = messagesRef.current;
    const lastUserMessageIndex = currentMessages.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMsg = currentMessages[lastUserMessageIndex];
    const lastUserMessage = lastUserMsg.content;
    const lastUserAttachments = lastUserMsg.attachments;
    
    setMessages(() => {
      const newMessages = currentMessages.filter((_, i) => i <= lastUserMessageIndex);
      return [...newMessages, { role: 'assistant' as const, content: '' }];
    });
    setIsLoading(true);
    setError(null);

    try {
      await sendMessageToConversationStream(userId, currentConversationId, lastUserMessage, (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          const lastMessage = newMessages[lastIndex];
          if (lastMessage.role === 'assistant') {
            newMessages[lastIndex] = { ...lastMessage, content: lastMessage.content + chunk };
          }
          return newMessages;
        });
      }, lastUserAttachments);
      
      loadConversations();
      setTimeout(() => loadMemories(), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error regenerating:', errorMessage);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentConversationId, isLoading, loadConversations, loadMemories]);

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
        <div className="app-container">
          <Sidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            memories={memories}
            onDeleteMemory={handleDeleteMemory}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onClose={closeSidebar}
          />
          
          <div className="main-content">
            {error && (
              <div className="error-banner">
                Error: {error}
              </div>
            )}
            
            {currentConversationId || messages.length > 0 ? (
              <main className="app-main">
                <ChatWindow messages={messages} isLoading={isLoading} onRegenerate={handleRegenerate} />
                <InputBox onSendMessage={handleSendMessage} isLoading={isLoading} inputRef={inputRef} />
              </main>
            ) : (
              <div className="welcome-screen">
                <h2>Welcome!</h2>
                <div className="affirmation-carousel">
                  <p key={affirmationIndex} className="affirmation-text">
                    {POSITIVE_AFFIRMATIONS[affirmationIndex]}
                  </p>
                </div>
                <button className="start-chat-btn" onClick={handleNewChat}>
                  Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
