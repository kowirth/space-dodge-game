import React, { useState, useEffect } from 'react';

const GameUI = ({ gameState, restartGame, togglePause }) => {
  const [activeKeys, setActiveKeys] = useState({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
  });

  // Add keyboard listener to show active keys
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        setActiveKeys(prev => ({
          ...prev,
          [event.key]: true
        }));
      }
    };
    
    const handleKeyUp = (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        setActiveKeys(prev => ({
          ...prev,
          [event.key]: false
        }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  console.log("Rendering GameUI, gameState:", gameState);

  // Define keyboard styles
  const keyStyle = {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
    borderRadius: '5px',
    margin: '2px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  };

  const activeKeyStyle = {
    ...keyStyle,
    backgroundColor: 'rgba(0, 255, 255, 0.7)',
    color: 'black',
    boxShadow: '0 0 10px #00ffff'
  };

  const getKeyStyle = (key) => activeKeys[key] ? activeKeyStyle : keyStyle;

  return (
    <>
      {gameState.isRunning && (
        <div className="game-ui">
          <div>Time: {formatTime(gameState.time)}</div>
          <div>Difficulty: {Math.floor((gameState.time / 30) + 1)}</div>
          
          {/* Pause status indicator */}
          {gameState.isPaused ? (
            <div style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: 'rgba(255, 165, 0, 0.6)',
              color: 'white',
              borderRadius: '5px',
              fontWeight: 'bold',
              animation: 'pulse 1.5s infinite'
            }}>
              PAUSED - Press SPACE to resume
            </div>
          ) : (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '18px', 
              opacity: 0.9,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '5px 10px',
              borderRadius: '5px'
            }}>
              <strong>USE ARROW KEYS or WASD to move</strong>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                Press SPACE to pause
              </div>
            </div>
          )}
          
          {/* Only show keyboard controls if not paused */}
          {!gameState.isPaused && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Arrow keys */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
                <div style={getKeyStyle('ArrowUp')}>↑</div>
                <div style={{ display: 'flex' }}>
                  <div style={getKeyStyle('ArrowLeft')}>←</div>
                  <div style={getKeyStyle('ArrowDown')}>↓</div>
                  <div style={getKeyStyle('ArrowRight')}>→</div>
                </div>
              </div>
              
              {/* WASD keys */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={getKeyStyle('w')}>W</div>
                <div style={{ display: 'flex' }}>
                  <div style={getKeyStyle('a')}>A</div>
                  <div style={getKeyStyle('s')}>S</div>
                  <div style={getKeyStyle('d')}>D</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {gameState.isGameOver && (
        <div className="game-over">
          <h1>Game Over!</h1>
          <p>You survived for {formatTime(gameState.time)}</p>
          <button 
            onClick={restartGame}
            style={{
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '24px',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 0 15px #ff0000'
            }}
          >
            Play Again
          </button>
          <p style={{ marginTop: '10px', fontSize: '18px' }}>Press 'R' to restart</p>
        </div>
      )}

      {!gameState.isRunning && !gameState.isGameOver && (
        <div className="game-over" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: '30px', borderRadius: '10px' }}>
          <h1 style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}>Space Obstacle Course</h1>
          <div style={{ color: 'white', fontSize: '20px', margin: '20px 0' }}>
            <p style={{ margin: '15px 0' }}><strong>Controls:</strong></p>
            <p style={{ margin: '5px 0' }}>↑ or W = Move Up</p>
            <p style={{ margin: '5px 0' }}>↓ or S = Move Down</p>
            <p style={{ margin: '5px 0' }}>← or A = Move Left</p>
            <p style={{ margin: '5px 0' }}>→ or D = Move Right</p>
            <p style={{ margin: '5px 0' }}>SPACE = Pause/Resume Game</p>
            <p style={{ margin: '15px 0' }}>Avoid obstacles as long as possible</p>
            <p style={{ margin: '15px 0', fontSize: '18px', color: '#ffff00' }}>
              <strong>Press SPACE to begin or click the button below</strong>
            </p>
          </div>
          <button 
            onClick={restartGame}
            style={{
              backgroundColor: '#00ffff',
              color: 'black',
              border: 'none',
              padding: '15px 30px',
              fontSize: '24px',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: '0 0 15px #00ffff',
              animation: 'pulse 1.5s infinite'
            }}
          >
            Start Game
          </button>
          <p style={{ marginTop: '15px', fontSize: '16px', color: '#ff9900' }}>
            <strong>→ TRY THE NUMPAD KEYS (2,4,6,8) IF ARROW KEYS DON'T WORK ←</strong>
          </p>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default GameUI; 