'use client';

import { useState } from 'react';
import PongLanding from './components/PongLanding';
import PongGame from './components/PongGame';
import './styles/PongGame.css';
import './styles/PongLanding.css';

export default function PongPage() {
  const [currentView, setCurrentView] = useState<'landing' | 'game'>('landing');

  const handleStartGame = () => {
    setCurrentView('game');
  };

  const handleBackToMenu = () => {
    setCurrentView('landing');
  };

  return (
    <div className="pong-container">
      {currentView === 'landing' ? (
        <PongLanding onStartGame={handleStartGame} />
      ) : (
        <PongGame onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}