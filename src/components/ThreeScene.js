import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeScene = ({ gameState, setGameState, restartGame }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const shipRef = useRef(null);
  const obstaclesRef = useRef([]);
  const starsRef = useRef([]);
  const requestRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const keysRef = useRef({});
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    // Start game loop
    clockRef.current.start();
    
    // Initial render of the scene to ensure it's visible
    renderer.render(scene, camera);
    
    // Start basic animation loop regardless of game state
    const basicAnimationLoop = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        // Rotate stars slightly for background animation
        if (starsRef.current.length > 0) {
          starsRef.current[0].rotation.x += 0.0001;
          starsRef.current[0].rotation.y += 0.0001;
        }
        
        // Always show the ship even in menu
        if (shipRef.current && !gameState.isRunning) {
          shipRef.current.rotation.y += 0.01;
        }
        
        renderer.render(scene, camera);
      }
      
      if (!gameState.isRunning) {
        requestRef.current = requestAnimationFrame(basicAnimationLoop);
      }
    };
    
    basicAnimationLoop();
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Three.js scene");
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    console.log("Game state changed:", gameState);
    if (gameState.isRunning) {
      console.log("Game is running, starting game loop");
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
      
      lastUpdateTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(gameLoop);
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
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
    // Prevent default behavior for arrow keys to avoid page scrolling
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", " "].includes(event.key)) {
      event.preventDefault();
    }
    
    keysRef.current[event.key] = true;
    
    // Allow spacebar to start the game
    if (event.key === " " && !gameState.isRunning && !gameState.isGameOver) {
      restartGame();
    }
  };
  
  const handleKeyUp = (event) => {
    keysRef.current[event.key] = false;
  };
  
  const createShip = () => {
    const scene = sceneRef.current;
    
    // Create a ship model
    const shipGeometry = new THREE.ConeGeometry(0.2, 0.8, 16);
    const shipMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff, 
      emissive: 0x0088ff, 
      shininess: 100,
      emissiveIntensity: 0.5
    });
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    
    // Rotate to make the cone point forward
    ship.rotation.x = Math.PI / 2;
    
    // Lights on the ship
    const shipLight = new THREE.PointLight(0x00ffff, 1, 5);
    shipLight.position.set(0, 0, -0.5);
    ship.add(shipLight);
    
    // Add wings to the ship
    const wingGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.2);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x0088ff, 
      emissive: 0x0044aa,
      shininess: 100 
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.3, 0, 0.2);
    ship.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.3, 0, 0.2);
    ship.add(rightWing);
    
    // Move ship slightly away from camera to be visible
    ship.position.z = -2;
    
    scene.add(ship);
    shipRef.current = ship;
    
    console.log("Ship created:", ship);
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
  
  const gameLoop = (time) => {
    if (!gameState.isRunning) return;
    
    const deltaTime = time - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = time;
    
    updateShip(deltaTime);
    updateObstacles(deltaTime);
    updateDifficulty();
    checkCollisions();
    
    // Create new obstacles
    if (Math.random() < 0.01 * speedRef.current) {
      createObstacle();
    }
    
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      
      renderer.render(scene, camera);
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  const updateShip = (deltaTime) => {
    if (!shipRef.current) return;
    
    const ship = shipRef.current;
    const moveSpeed = 0.01 * deltaTime;
    
    // Log the state of keys for debugging
    if (keysRef.current['ArrowUp'] || keysRef.current['ArrowDown'] || 
        keysRef.current['ArrowLeft'] || keysRef.current['ArrowRight'] ||
        keysRef.current['w'] || keysRef.current['a'] || 
        keysRef.current['s'] || keysRef.current['d']) {
      console.log("Keys pressed:", keysRef.current);
    }
    
    // Update ship position based on key presses
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
      ship.position.y += moveSpeed;
    }
    
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) {
      ship.position.y -= moveSpeed;
    }
    
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
      ship.position.x -= moveSpeed;
      // Tilt ship left
      ship.rotation.z = Math.min(ship.rotation.z + 0.1, 0.3);
    } else if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
      ship.position.x += moveSpeed;
      // Tilt ship right
      ship.rotation.z = Math.max(ship.rotation.z - 0.1, -0.3);
    } else {
      // Return to neutral position
      ship.rotation.z *= 0.9;
    }
    
    // Clamp ship position to screen bounds
    ship.position.x = Math.max(-5, Math.min(5, ship.position.x));
    ship.position.y = Math.max(-3, Math.min(3, ship.position.y));
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
  
  return (
    <div ref={mountRef} className="game-container" />
  );
};

export default ThreeScene; 