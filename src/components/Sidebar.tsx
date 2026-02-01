import { useState } from 'react';
import type { Conversation, Memory } from '../utils/api';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: number) => void;
  memories: Memory[];
  onDeleteMemory: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  memories,
  onDeleteMemory,
  isOpen,
  onToggle,
  onClose,
}: SidebarProps) {
  const [showMemories, setShowMemories] = useState(false);

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleSelectConversation = (id: number) => {
    onSelectConversation(id);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      
      <button className="sidebar-toggle" onClick={onToggle}>
        {isOpen ? '✕' : '☰'}
      </button>
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            + New Chat
          </button>
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`tab-btn ${!showMemories ? 'active' : ''}`}
            onClick={() => setShowMemories(false)}
          >
            Chats
          </button>
          <button 
            className={`tab-btn ${showMemories ? 'active' : ''}`}
            onClick={() => setShowMemories(true)}
          >
            Memory
          </button>
        </div>

        <div className="sidebar-content">
          {!showMemories ? (
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <p className="empty-state">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <span className="conversation-title">{conv.title}</span>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="memories-list">
              {memories.length === 0 ? (
                <p className="empty-state">No memories saved yet. Chat with the AI and it will remember important things about you.</p>
              ) : (
                memories.map((memory) => (
                  <div key={memory.id} className="memory-item">
                    <span className="memory-content">{memory.content}</span>
                    <button
                      className="delete-btn"
                      onClick={() => onDeleteMemory(memory.id)}
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
