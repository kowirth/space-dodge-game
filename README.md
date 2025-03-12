# Space Obstacle Course

A 3D space game built with React and Three.js where you control a spaceship and navigate through obstacles in space.

## Game Description

In this game, you control a spaceship flying through space. Your goal is to survive as long as possible by avoiding various obstacles such as asteroids and planets. The game gets progressively harder as time passes, with obstacles appearing more frequently and moving faster.

## How to Play

1. Use the arrow keys or WASD to move your spaceship:
   - Up Arrow / W: Move Up
   - Down Arrow / S: Move Down
   - Left Arrow / A: Move Left
   - Right Arrow / D: Move Right

2. Avoid colliding with asteroids and planets.

3. Try to survive as long as possible. Your time is displayed in the top-left corner.

## Game Features

- 3D space environment with stars
- Realistic-looking obstacles (asteroids and planets)
- Progressive difficulty that increases over time
- Timer to track your survival time
- Simple and intuitive controls

## Technology Stack

- React for UI and game state management
- Three.js for 3D rendering
- JavaScript for game logic

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine

### Installation

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Development

The game is structured with the following components:

- `App.js`: Main container that manages game state
- `ThreeScene.js`: Handles the Three.js scene rendering and game logic
- `GameUI.js`: Displays game information and UI elements

The game logic is primarily contained in the ThreeScene component, where obstacles are created, collisions are detected, and the game loop is managed.

## License

This project is open source and available under the MIT License.
