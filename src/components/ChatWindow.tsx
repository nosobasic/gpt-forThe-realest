import { useEffect, useRef, useState } from 'react';
import type { Message as MessageType } from '../utils/api';
import Message from './Message';

interface ChatWindowProps {
  messages: MessageType[];
  isLoading: boolean;
}

const POSITIVE_AFFIRMATIONS = [
  "You are capable of amazing things! 🌟",
  "Every day is a fresh start! ✨",
  "You have the power to create change! 💪",
  "Believe in yourself - you've got this! 🚀",
  "Your potential is limitless! 🌈",
  "You are stronger than you know! 💎",
  "Great things are coming your way! 🎯",
  "You deserve happiness and success! 💖",
  "Your dreams are within reach! 🌙",
  "You are worthy of all good things! ⭐",
  "Keep going - you're doing great! 🎊",
  "You radiate positivity and light! ☀️",
  "You are exactly where you need to be! 🌺",
  "Your efforts are making a difference! 🎨",
  "You bring joy to those around you! 😊",
  "Every challenge makes you stronger! 🏋️",
  "You are creating the life you want! 🌱",
  "Your kindness matters! 💐",
  "You have unique gifts to share! 🎁",
  "Progress, not perfection! 📈",
  "You are enough, just as you are! 💙",
  "Your future is bright! 🔆",
  "You handle everything with grace! 🦢",
  "You inspire others! 🌟",
  "You choose to see the good! 👁️",
  "You are a work in progress and that's beautiful! 🎭",
  "Your energy attracts what you need! ⚡",
  "You are building something amazing! 🏗️",
  "You trust the journey! 🗺️",
  "You are loved and supported! 🤗",
];

/**
 * ChatWindow Component
 * Displays all messages in the conversation with auto-scroll to newest
 */
export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Rotate through affirmations
  useEffect(() => {
    if (messages.length === 0) {
      const interval = setInterval(() => {
        setCurrentAffirmationIndex((prev) => 
          (prev + 1) % POSITIVE_AFFIRMATIONS.length
        );
      }, 5000); // Change every 5 seconds (slowed down from 3 seconds)

      return () => clearInterval(interval);
    }
  }, [messages.length]);

  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <div className="empty-state">
          <h2>Welcome to ChatGPT Clone</h2>
          <div className="affirmation-carousel">
            <p key={currentAffirmationIndex} className="affirmation-text">
              {POSITIVE_AFFIRMATIONS[currentAffirmationIndex]}
            </p>
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
          {isLoading && (
            <div className="message message-assistant">
              <div className="message-content">
                <div className="message-role">Assistant</div>
                <div className="message-text loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}

