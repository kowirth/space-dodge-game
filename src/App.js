import React, { useState, useEffect } from 'react';
import './App.css';
import ThreeScene from './components/ThreeScene';
import GameUI from './components/GameUI';

function App() {
  const [gameState, setGameState] = useState({
    isRunning: false,
    isGameOver: false,
    time: 0
  });

  // Effect to listen for keyboard events at the app level
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Spacebar to start the game
      if (event.key === " " && !gameState.isRunning && !gameState.isGameOver) {
        restartGame();
      }
      
      // 'R' key to restart after game over
      if (event.key === "r" && gameState.isGameOver) {
        restartGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isRunning, gameState.isGameOver]);
  
  const restartGame = () => {
    console.log("Restarting game...");
    setGameState({
      isRunning: true,
      isGameOver: false,
      time: 0
    });
  };

  return (
    <div className="App">
      <ThreeScene
        gameState={gameState}
        setGameState={setGameState}
        restartGame={restartGame}
      />
      <GameUI
        gameState={gameState}
        restartGame={restartGame}
      />
    </div>
  );
}

export default App;
