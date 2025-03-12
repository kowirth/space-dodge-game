import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const ThreeScene = ({ gameState, setGameState, restartGame, togglePause }) => {
  // Add useState to create a forceUpdate function
  const [, forceRender] = useState(0);
  const forceUpdate = () => forceRender(prev => prev + 1);
  
  // Add state for movement diagnostics
  const [movementDebug, setMovementDebug] = useState({
    lastPosition: { x: 0, y: 0, z: -2 },
    movementAttempted: 0,
    movementSucceeded: 0,
    isPositionChanging: false
  });
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const shipRef = useRef(null);
  const obstaclesRef = useRef([]);
  const starsRef = useRef([]);
  const requestRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
    2: false,  // Numpad and numeric keys
    4: false,
    6: false,
    8: false
  });
  const clockRef = useRef(new THREE.Clock());
  const speedRef = useRef(1);
  
  // Initialize the scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log("Initializing Three.js scene");
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);
    
    // Create player ship
    createShip();
    
    // Create stars background
    createStars();
    
    // Add event listeners for keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    // Start game loop
    clockRef.current.start();
    
    // Initial render of the scene to ensure it's visible
    renderer.render(scene, camera);
    
    // Start animation loop - we'll use a single animation loop for everything
    const animationLoop = (time) => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        const deltaTime = time - lastUpdateTimeRef.current || 16.67; // Default to 60fps if first frame
        lastUpdateTimeRef.current = time;
        
        // Rotate stars slightly for background animation
        if (starsRef.current.length > 0) {
          starsRef.current[0].rotation.x += 0.0001;
          starsRef.current[0].rotation.y += 0.0001;
        }
        
        // Always try to update ship with direct input (more reliable than updateShip)
        if (gameState.isRunning && !gameState.isPaused && shipRef.current) {
          // Get active keys and directly apply movement in animation loop
          const moveSpeed = 0.08;
          let didMove = false;
          let initialPosition = { ...shipRef.current.position };
          
          if (keysRef.current.ArrowUp || keysRef.current.w || keysRef.current['8']) {
            shipRef.current.position.y += moveSpeed;
            didMove = true;
          }
          if (keysRef.current.ArrowDown || keysRef.current.s || keysRef.current['2']) {
            shipRef.current.position.y -= moveSpeed;
            didMove = true;
          }
          if (keysRef.current.ArrowLeft || keysRef.current.a || keysRef.current['4']) {
            shipRef.current.position.x -= moveSpeed;
            shipRef.current.rotation.z = Math.min(shipRef.current.rotation.z + 0.1, 0.5);
            didMove = true;
          }
          if (keysRef.current.ArrowRight || keysRef.current.d || keysRef.current['6']) {
            shipRef.current.position.x += moveSpeed;
            shipRef.current.rotation.z = Math.max(shipRef.current.rotation.z - 0.1, -0.5);
            didMove = true;
          }
          
          // Continue with original game loop for obstacles, etc.
          updateObstacles(deltaTime);
          updateDifficulty();
          checkCollisions();
          
          // Create new obstacles
          if (Math.random() < 0.01 * speedRef.current) {
            createObstacle();
          }
          
          // Log movement for debugging
          if (didMove) {
            console.log('🚀 FRAME MOVE: Ship moved from', 
              initialPosition.x.toFixed(2), initialPosition.y.toFixed(2),
              'to', 
              shipRef.current.position.x.toFixed(2), shipRef.current.position.y.toFixed(2));
          }
        } else if (gameState.isRunning && gameState.isPaused) {
          // Game is paused - just show static scene
          // No updates to ship or obstacles
        } else {
          // Game is not running - just rotate the ship
          if (shipRef.current) {
            shipRef.current.rotation.y += 0.01;
          }
        }
        
        // Render the scene
        renderer.render(scene, camera);
      }
      
      // Continue the animation loop
      requestRef.current = requestAnimationFrame(animationLoop);
    };
    
    // Start the animation loop
    requestRef.current = requestAnimationFrame(animationLoop);
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Three.js scene");
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState.isRunning, gameState.isPaused]);
  
  // Handle game state changes
  useEffect(() => {
    console.log("Game state changed:", gameState);
    if (gameState.isRunning) {
      console.log("Game is running, resetting ship position");
      // Reset ship position when starting a new game
      if (shipRef.current) {
        shipRef.current.position.set(0, 0, -2);
        shipRef.current.rotation.set(Math.PI / 2, 0, 0);
      }
      
      // Clear any existing obstacles
      if (sceneRef.current) {
        obstaclesRef.current.forEach(obstacle => {
          sceneRef.current.remove(obstacle);
        });
        obstaclesRef.current = [];
      }
      
      console.log("USE ARROW KEYS OR WASD TO MOVE THE SHIP!");
      alert("Game started! Use arrow keys or WASD to move.");
    }
  }, [gameState.isRunning]);
  
  const handleResize = () => {
    if (cameraRef.current && rendererRef.current) {
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };
  
  const handleKeyDown = (event) => {
    console.log('Key down:', event.key, 'Active keys before:', keysRef.current);
    
    // Prevent default behavior
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', '2', '4', '6', '8'].includes(event.key)) {
      event.preventDefault();
      keysRef.current[event.key] = true;
      
      // DIRECTLY move the ship for more immediate feedback - only if game is running and not paused
      if (shipRef.current && gameState.isRunning && !gameState.isPaused) {
        const moveAmount = 0.3; // Larger direct movement
        
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === '8') {
          shipRef.current.position.y += moveAmount;
          console.log("DIRECT MOVE UP:", shipRef.current.position.y);
        }
        if (event.key === 'ArrowDown' || event.key === 's' || event.key === '2') {
          shipRef.current.position.y -= moveAmount;
          console.log("DIRECT MOVE DOWN:", shipRef.current.position.y);
        }
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === '4') {
          shipRef.current.position.x -= moveAmount;
          console.log("DIRECT MOVE LEFT:", shipRef.current.position.x);
        }
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === '6') {
          shipRef.current.position.x += moveAmount;
          console.log("DIRECT MOVE RIGHT:", shipRef.current.position.x);
        }
        
        // Keep the ship within bounds
        if (shipRef.current.position.x > 5) shipRef.current.position.x = 5;
        if (shipRef.current.position.x < -5) shipRef.current.position.x = -5;
        if (shipRef.current.position.y > 3) shipRef.current.position.y = 3;
        if (shipRef.current.position.y < -3) shipRef.current.position.y = -3;
        
        forceUpdate(); // Force the render
      }
    }
    
    // Debug: Force start the game with F key
    if (event.key === 'f' || event.key === 'F') {
      console.log("Force starting game with F key");
      setGameState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    }
  };
  
  const handleKeyUp = (event) => {
    console.log('Key up:', event.key);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', '2', '4', '6', '8'].includes(event.key)) {
      keysRef.current[event.key] = false;
    }
  };
  
  const createShip = () => {
    const scene = sceneRef.current;
    
    // Create ship group using rendered shapes for the rocket
    const shipGroup = new THREE.Group();
    
    // Create the rocket body as a cone
    const bodyGeometry = new THREE.ConeGeometry(0.5, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x000033 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.rotation.x = Math.PI / 2; // Rotate to point forward
    shipGroup.add(bodyMesh);
    
    // Create wings as boxes
    const wingGeometry = new THREE.BoxGeometry(0.1, 0.5, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0);
    shipGroup.add(leftWing);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0);
    shipGroup.add(rightWing);
    
    // Add a point light for engine glow
    const engineLight = new THREE.PointLight(0x00ffff, 1, 3);
    engineLight.position.set(0, -0.5, -0.7);
    shipGroup.add(engineLight);
    
    // Position the ship and add to scene
    shipGroup.position.set(0, 0, -2);
    scene.add(shipGroup);
    shipRef.current = shipGroup;
    
    // Initial test movement
    setTimeout(() => {
      if (shipRef.current) {
        console.log("🚀 Initial test movement for ship");
        shipRef.current.position.x += 0.5;
        forceUpdate();
      }
    }, 100);
    
    console.log("Ship created with Three.js shapes (cone and boxes).");
  };
  
  const createStars = () => {
    const scene = sceneRef.current;
    
    // Create star particles
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    const starsVertices = [];
    
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current.push(stars);
    
    console.log("Stars created");
    
    // Add a few larger stars/distant planets for interest
    for (let i = 0; i < 5; i++) {
      const size = Math.random() * 1 + 0.5;
      const planetGeometry = new THREE.SphereGeometry(size, 16, 16);
      
      // Random planet color
      const hue = Math.random();
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
        emissive: new THREE.Color().setHSL(hue, 0.7, 0.2),
        shininess: 20
      });
      
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      
      // Position far away from camera
      const posX = (Math.random() - 0.5) * 80;
      const posY = (Math.random() - 0.5) * 80;
      const posZ = -100 - Math.random() * 50;
      planet.position.set(posX, posY, posZ);
      
      scene.add(planet);
    }
  };
  
  const createObstacle = () => {
    const scene = sceneRef.current;
    
    // Randomize obstacle type (asteroid or planet)
    const type = Math.random() > 0.8 ? 'planet' : 'asteroid';
    
    let obstacle;
    
    if (type === 'planet') {
      // Create a planet
      const size = Math.random() * 1.5 + 0.5;
      const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
      
      // Random planet color
      const hue = Math.random();
      const planetMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 0.7, 0.5),
        emissive: new THREE.Color().setHSL(hue, 0.7, 0.2),
        shininess: 20
      });
      
      obstacle = new THREE.Mesh(planetGeometry, planetMaterial);
    } else {
      // Create an asteroid
      const size = Math.random() * 0.5 + 0.2;
      const asteroidGeometry = new THREE.DodecahedronGeometry(size, 0);
      
      // Add noise to asteroid vertices for uneven surface
      const pos = asteroidGeometry.attributes.position;
      const v3 = new THREE.Vector3();
      
      for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        v3.normalize().multiplyScalar(size + (Math.random() * 0.15 - 0.075));
        pos.setXYZ(i, v3.x, v3.y, v3.z);
      }
      
      asteroidGeometry.computeVertexNormals();
      
      const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1
      });
      
      obstacle = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      
      // Add random rotation to make asteroids tumble
      obstacle.userData.rotationSpeed = {
        x: Math.random() * 0.02 - 0.01,
        y: Math.random() * 0.02 - 0.01,
        z: Math.random() * 0.02 - 0.01
      };
    }
    
    // Position obstacles in front of the player with random x,y placement
    const posX = (Math.random() - 0.5) * 10;
    const posY = (Math.random() - 0.5) * 10;
    obstacle.position.set(posX, posY, -50);
    
    // Add speed property to the obstacle
    obstacle.userData.speed = Math.random() * 0.2 + 0.3;
    
    scene.add(obstacle);
    obstaclesRef.current.push(obstacle);
  };
  
  const updateObstacles = (deltaTime) => {
    // Move obstacles toward player
    obstaclesRef.current.forEach((obstacle, index) => {
      // Move forward
      obstacle.position.z += obstacle.userData.speed * speedRef.current * 0.1 * deltaTime;
      
      // Apply rotations to asteroids
      if (obstacle.userData.rotationSpeed) {
        obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
        obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
        obstacle.rotation.z += obstacle.userData.rotationSpeed.z;
      }
      
      // Remove obstacles that have passed the player
      if (obstacle.position.z > 10) {
        sceneRef.current.remove(obstacle);
        obstaclesRef.current.splice(index, 1);
      }
    });
  };
  
  const updateDifficulty = () => {
    const elapsedTime = clockRef.current.getElapsedTime();
    
    // Gradually increase speed over time
    speedRef.current = 1 + (elapsedTime / 60); // Increment by 1 every minute
    
    // Update the game state with current time
    setGameState(prev => ({
      ...prev,
      time: Math.floor(elapsedTime)
    }));
  };
  
  const checkCollisions = () => {
    if (!shipRef.current) return;
    
    const ship = shipRef.current;
    const shipPosition = ship.position;
    
    // Create a bounding sphere for the ship
    const shipBoundingSphere = new THREE.Sphere(shipPosition, 0.3);
    
    // Check collision with each obstacle
    for (const obstacle of obstaclesRef.current) {
      // Create a bounding sphere for the obstacle
      const obstacleBoundingSphere = new THREE.Sphere(
        obstacle.position,
        obstacle.geometry.parameters.radius || 0.3
      );
      
      // Check if the spheres intersect
      if (shipBoundingSphere.intersectsSphere(obstacleBoundingSphere)) {
        // Game over
        console.log("Collision detected! Game over");
        setGameState(prev => ({
          ...prev,
          isRunning: false,
          isGameOver: true
        }));
        break;
      }
    }
  };
  
  // Add a direct control function that will be called in the component to test controls
  const testShipMovement = () => {
    if (!shipRef.current) return;
    
    console.log('TEST: Moving ship directly');
    
    // Move the ship up and to the right as a test
    shipRef.current.position.y += 0.1;
    shipRef.current.position.x += 0.1;
    
    console.log('TEST: New ship position:', shipRef.current.position);
    
    // Force a re-render
    forceUpdate();
  };

  // Call test movement after initial render
  useEffect(() => {
    const testControls = setTimeout(() => {
      console.log('Running control test');
      testShipMovement();
    }, 3000); // Test 3 seconds after component mounts
    
    return () => clearTimeout(testControls);
  }, []);
  
  // Add auto-wiggle effect for the ship - only when not paused
  useEffect(() => {
    // Only apply auto-wiggle when game is running and not paused
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const wiggleInterval = setInterval(() => {
      if (shipRef.current) {
        // Small random movement to show the ship can move
        const randomX = (Math.random() - 0.5) * 0.2;
        const randomY = (Math.random() - 0.5) * 0.2;
        
        shipRef.current.position.x += randomX;
        shipRef.current.position.y += randomY;
        
        console.log("AUTO-WIGGLE: Ship moved to", shipRef.current.position.x, shipRef.current.position.y);
        forceUpdate();
      }
    }, 2000); // Every 2 seconds
    
    return () => clearInterval(wiggleInterval);
  }, [gameState.isRunning, gameState.isPaused]);
  
  // Add continuous motion effect specifically to debug movement issues
  useEffect(() => {
    // Skip this if the game isn't running or is paused
    if (!gameState.isRunning || gameState.isPaused) return;
    
    console.log("🔄 Setting up continuous motion for ship debugging");
    
    // Move in small circles to verify ship can move
    const debugInterval = setInterval(() => {
      if (shipRef.current) {
        // Calculate position before movement
        const prevPos = {
          x: shipRef.current.position.x,
          y: shipRef.current.position.y,
          z: shipRef.current.position.z
        };
        
        // Make the ship move in a simple pattern
        const time = Date.now() / 1000;
        const moveX = Math.sin(time) * 0.05;
        const moveY = Math.cos(time) * 0.05;
        
        shipRef.current.position.x += moveX;
        shipRef.current.position.y += moveY;
        
        // Keep within boundaries
        if (shipRef.current.position.x > 5) shipRef.current.position.x = 5;
        if (shipRef.current.position.x < -5) shipRef.current.position.x = -5;
        if (shipRef.current.position.y > 3) shipRef.current.position.y = 3;
        if (shipRef.current.position.y < -3) shipRef.current.position.y = -3;
        
        // Calculate new position after movement
        const newPos = {
          x: shipRef.current.position.x,
          y: shipRef.current.position.y,
          z: shipRef.current.position.z
        };
        
        // Check if position actually changed
        const positionChanged = 
          prevPos.x !== newPos.x || 
          prevPos.y !== newPos.y;
        
        // Update debug state
        setMovementDebug(prev => ({
          lastPosition: newPos,
          movementAttempted: prev.movementAttempted + 1,
          movementSucceeded: positionChanged ? prev.movementSucceeded + 1 : prev.movementSucceeded,
          isPositionChanging: positionChanged
        }));
        
        if (positionChanged) {
          console.log("🚀 AUTO-MOVE: Ship moved to", newPos.x.toFixed(2), newPos.y.toFixed(2));
          // Force a re-render
          forceUpdate();
        } else {
          console.error("⚠️ AUTO-MOVE: Ship position not changing despite attempts!");
        }
      } else {
        console.error("⚠️ Ship reference is null - cannot move!");
      }
    }, 200); // Try to move every 200ms
    
    return () => clearInterval(debugInterval);
  }, [gameState.isRunning, gameState.isPaused]);
  
  // Movement statistics display overlay 
  const DiagnosticsOverlay = useCallback(() => {
    if (!gameState.isRunning) return null;
    
    return (
      <div style={{
        position: 'absolute',
        top: '100px',
        right: '20px',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: movementDebug.isPositionChanging ? '#00ff00' : '#ff0000',
        border: `2px solid ${movementDebug.isPositionChanging ? '#00ff00' : '#ff0000'}`,
        borderRadius: '5px',
        zIndex: 3000,
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        <div><strong>MOVEMENT DIAGNOSTICS:</strong></div>
        <div>X: {movementDebug.lastPosition.x.toFixed(2)}</div>
        <div>Y: {movementDebug.lastPosition.y.toFixed(2)}</div>
        <div>Z: {movementDebug.lastPosition.z.toFixed(2)}</div>
        <div>Attempts: {movementDebug.movementAttempted}</div>
        <div>Successes: {movementDebug.movementSucceeded}</div>
        <div>Status: {movementDebug.isPositionChanging ? 'MOVING' : 'STUCK'}</div>
      </div>
    );
  }, [gameState.isRunning, movementDebug]);

  // Add emergency "Push Ship" button
  const EmergencyControls = useCallback(() => {
    return (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 3000
      }}>
        <button
          style={{
            padding: '15px 30px',
            fontSize: '20px',
            backgroundColor: '#ff0000',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => {
            if (shipRef.current) {
              // Make a big obvious movement 
              shipRef.current.position.x += 1.0;
              shipRef.current.position.y += 1.0;
              console.log("🔥 EMERGENCY MOVE: Force pushing ship to new position!", shipRef.current.position);
              
              // Reset game if necessary
              if (!gameState.isRunning) {
                console.log("🔄 EMERGENCY: Starting game...");
                restartGame();
              }
              
              if (gameState.isPaused) {
                console.log("🔄 EMERGENCY: Unpausing game...");
                togglePause();
              }
              
              forceUpdate();
            } else {
              console.error("⚠️ EMERGENCY: Ship reference is null!");
            }
          }}
        >
          EMERGENCY SHIP PUSH
        </button>
      </div>
    );
  }, [gameState.isRunning, gameState.isPaused, restartGame, togglePause]);
  
  return (
    <div>
      <div ref={mountRef} className="game-container" />
      
      {/* Add emergency controls and diagnostics */}
      <EmergencyControls />
      <DiagnosticsOverlay />
      
      {/* Pause Overlay - only show when paused */}
      {gameState.isPaused && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000
        }}>
          <div style={{
            padding: '30px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            border: '2px solid #00ffff',
            boxShadow: '0 0 20px #00ffff',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#00ffff', fontSize: '36px', marginBottom: '20px' }}>GAME PAUSED</h1>
            <p style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>Press SPACE to resume</p>
            <button 
              style={{ 
                padding: '10px 20px', 
                fontSize: '18px', 
                backgroundColor: '#00ffff',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }} 
              onClick={togglePause}
            >
              RESUME GAME
            </button>
          </div>
        </div>
      )}
      
      {/* Manual control buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '10px'
      }}>
        <button 
          style={{ margin: '5px', padding: '10px 20px', fontSize: '18px' }} 
          onClick={() => {
            console.log("Force ship up button pressed");
            if (shipRef.current && !gameState.isPaused) {
              shipRef.current.position.y += 0.5;
              console.log("MANUAL BUTTON: Moving ship UP to", shipRef.current.position.y);
              forceUpdate();
            }
          }}
          disabled={gameState.isPaused}
        >
          MOVE UP
        </button>
        
        <div style={{ display: 'flex' }}>
          <button 
            style={{ margin: '5px', padding: '10px 20px', fontSize: '18px' }} 
            onClick={() => {
              console.log("Force ship left button pressed");
              if (shipRef.current && !gameState.isPaused) {
                shipRef.current.position.x -= 0.5;
                console.log("MANUAL BUTTON: Moving ship LEFT to", shipRef.current.position.x);
                forceUpdate();
              }
            }}
            disabled={gameState.isPaused}
          >
            MOVE LEFT
          </button>
          
          <button 
            style={{ margin: '5px', padding: '10px 20px', fontSize: '18px' }} 
            onClick={() => {
              console.log("Force ship down button pressed");
              if (shipRef.current && !gameState.isPaused) {
                shipRef.current.position.y -= 0.5;
                console.log("MANUAL BUTTON: Moving ship DOWN to", shipRef.current.position.y);
                forceUpdate();
              }
            }}
            disabled={gameState.isPaused}
          >
            MOVE DOWN
          </button>
          
          <button 
            style={{ margin: '5px', padding: '10px 20px', fontSize: '18px' }} 
            onClick={() => {
              console.log("Force ship right button pressed");
              if (shipRef.current && !gameState.isPaused) {
                shipRef.current.position.x += 0.5;
                console.log("MANUAL BUTTON: Moving ship RIGHT to", shipRef.current.position.x);
                forceUpdate();
              }
            }}
            disabled={gameState.isPaused}
          >
            MOVE RIGHT
          </button>
        </div>
        
        <div style={{ display: 'flex', marginTop: '10px' }}>
          <button
            style={{ 
              margin: '5px', 
              padding: '10px 20px', 
              fontSize: '18px',
              backgroundColor: gameState.isRunning ? 'green' : 'red'
            }}
            onClick={() => {
              console.log("Force game start button pressed");
              if (!gameState.isRunning) {
                restartGame();
              }
            }}
          >
            {gameState.isRunning ? "GAME RUNNING" : "FORCE START GAME"}
          </button>
          
          {gameState.isRunning && (
            <button
              style={{ 
                margin: '5px', 
                padding: '10px 20px', 
                fontSize: '18px',
                backgroundColor: gameState.isPaused ? 'orange' : '#333'
              }}
              onClick={togglePause}
            >
              {gameState.isPaused ? "RESUME" : "PAUSE"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreeScene; 