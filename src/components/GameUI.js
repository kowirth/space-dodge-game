import React from 'react';

const GameUI = ({ gameState, restartGame }) => {
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  console.log("Rendering GameUI, gameState:", gameState);

  return (
    <>
      {gameState.isRunning && (
        <div className="game-ui">
          <div>Time: {formatTime(gameState.time)}</div>
          <div>Difficulty: {Math.floor((gameState.time / 30) + 1)}</div>
          <div style={{ marginTop: '10px', fontSize: '16px', opacity: 0.7 }}>
            Arrow Keys or WASD to move
          </div>
        </div>
      )}

      {gameState.isGameOver && (
        <div className="game-over">
          <h1>Game Over!</h1>
          <p>You survived for {formatTime(gameState.time)}</p>
          <button onClick={restartGame}>Play Again</button>
          <p style={{ marginTop: '10px', fontSize: '16px' }}>Press 'R' to restart</p>
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
            <p style={{ margin: '15px 0' }}>Avoid obstacles as long as possible</p>
            <p style={{ margin: '15px 0', fontSize: '16px' }}>Press SPACE to begin</p>
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
              boxShadow: '0 0 15px #00ffff'
            }}
          >
            Start Game
          </button>
        </div>
      )}
    </>
  );
};

export default GameUI; 