import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ThreeScene from './components/ThreeScene';
import GameUI from './components/GameUI';

function App() {
  // Game state
  const [gameState, setGameState] = useState({
    isRunning: true, // Auto-start the game by default
    isGameOver: false,
    isPaused: false,
    time: 0,
  });

  // Restart game function
  const restartGame = useCallback(() => {
    console.log("Restarting game!");
    setGameState({
      isRunning: true,
      isGameOver: false,
      isPaused: false,
      time: 0,
    });
  }, []);

  // Toggle pause function
  const togglePause = useCallback(() => {
    if (gameState.isRunning && !gameState.isGameOver) {
      console.log(`${gameState.isPaused ? "Unpausing" : "Pausing"} game`);
      setGameState(prev => ({
        ...prev,
        isPaused: !prev.isPaused
      }));
    }
  }, [gameState.isRunning, gameState.isGameOver, gameState.isPaused]);

  // Force game to running state if it somehow stopped
  useEffect(() => {
    if (!gameState.isRunning && !gameState.isGameOver) {
      console.log("⚠️ Detected game not running - forcing to running state!");
      setGameState(prev => ({
        ...prev,
        isRunning: true
      }));
    }
  }, [gameState.isRunning, gameState.isGameOver]);

  // Handle keyboard events at app level to ensure they are always captured
  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log("App level key pressed:", event.key);
      
      // Toggle pause with spacebar if the game is running
      if (event.key === " ") {
        if (gameState.isRunning && !gameState.isGameOver) {
          console.log("Toggling pause with spacebar");
          togglePause();
        } else if (!gameState.isRunning && !gameState.isGameOver) {
          // Start game if not running and not game over
          console.log("Starting game with spacebar");
          restartGame();
        }
        // Prevent page scrolling with spacebar
        event.preventDefault();
      }
      
      // Restart game with R key if game over
      if ((event.key === "r" || event.key === "R") && gameState.isGameOver) {
        console.log("Restarting game with R key");
        restartGame();
      }
      
      // Debug: Force start game with F key for testing
      if ((event.key === "f" || event.key === "F") && !gameState.isRunning) {
        console.log("Forcing game start with F key");
        restartGame();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, restartGame, togglePause]);

  // Debug initial game state
  useEffect(() => {
    console.log("Initial game state:", gameState);
    console.log("Game should auto-start. Press SPACE to pause/resume");
    console.log("Use ARROW KEYS or WASD or NUMPAD (2,4,6,8) to move the ship");
    console.log("EMERGENCY BUTTON available if ship won't move");
  }, []);

  return (
    <div className="App">
      <ThreeScene 
        gameState={gameState} 
        setGameState={setGameState} 
        restartGame={restartGame}
        togglePause={togglePause} 
      />
      <GameUI 
        gameState={gameState} 
        restartGame={restartGame}
        togglePause={togglePause}
      />
    </div>
  );
}

export default App;
