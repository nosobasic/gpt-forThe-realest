import { useState, useEffect } from 'react';

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

export default function Home() {
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAffirmationIndex((prev) => (prev + 1) % POSITIVE_AFFIRMATIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home">
      <div className="home-content">
        <h1 className="home-title">Welcome to gpt 4 real</h1>
        <div className="affirmation-carousel">
          <p key={affirmationIndex} className="affirmation-text">
            {POSITIVE_AFFIRMATIONS[affirmationIndex]}
          </p>
        </div>
        <p className="home-subtitle">Please login to start chatting</p>
      </div>
    </div>
  );
}

