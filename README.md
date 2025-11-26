# 3D Mouse Maze

An immersive full-screen 3D maze game where you control the ball's movement by tilting the maze with your mouse. Navigate through the labyrinth while avoiding dangerous holes!

## 🎮 Game Features

### Core Mechanics
- **Mouse-Controlled Tilt**: Move your mouse to tilt the maze in real-time
- **Physics-Based Movement**: Realistic ball physics with gravity, friction, and momentum
- **Wall Collision**: The ball cannot pass through walls - navigate carefully!
- **Random Holes**: 6 holes randomly placed on the maze floor each game
- **Fall Detection**: If the ball falls into a hole, the game ends
- **Dynamic Restart**: Holes regenerate in new random positions each restart

### Visual Features
- **Full-Screen Experience**: Immersive gameplay that fills your entire screen
- **3D Perspective**: Dynamic camera angle for optimal visibility
- **Glowing Holes**: Red emissive holes with glowing rings for visibility
- **Realistic Lighting**: Multiple light sources including ambient, directional, and point lights
- **Metallic Ball**: Shiny reflective sphere with realistic materials
- **Shadow Mapping**: Real-time shadows for depth perception

### Controls
- **Mouse Movement**: Tilt the maze (move mouse around the screen)
- **R Key**: Restart the game at any time
- **Restart Button**: Click to restart after game over

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. Move your mouse around the screen to tilt the maze
3. Guide the ball through the labyrinth
4. Avoid falling into the glowing red holes!
5. If you fall in, press R or click "Restart" to try again with new hole positions

## 🎯 Game Objective

Navigate the ball through the 3D maze without falling into any holes. Each time you restart, the holes appear in new random locations, creating a unique challenge every time!

## 🛠️ Technical Implementation

### Technologies
- **Three.js (r128)**: 3D graphics rendering engine
- **Cannon.js (0.6.2)**: Physics engine for realistic ball movement
- **WebGL**: Hardware-accelerated 3D graphics
- **ES6 JavaScript**: Modern JavaScript with classes

### Physics System
- **Gravity**: Dynamic gravity that changes based on maze tilt
- **Collision Detection**: Physics-based wall collision prevention
- **Damping**: Linear and angular damping for realistic ball behavior
- **Contact Materials**: Custom friction and restitution for ball-maze interaction

### Architecture
```
MouseMaze Class
├── Three.js Scene Management
│   ├── Camera (Perspective)
│   ├── Renderer (WebGL)
│   ├── Lights (Ambient, Directional, Point)
│   └── Meshes (Maze, Ball, Holes)
├── Cannon.js Physics
│   ├── World (Gravity, Solver)
│   ├── Bodies (Ball, Walls, Floor)
│   └── Materials (Friction, Restitution)
└── Game Logic
    ├── Mouse Input Handler
    ├── Tilt Controller
    ├── Collision Checker
    └── Game State Manager
```

### Key Features Implementation

**Mouse-Based Tilting** (labyrinth.js:318-338):
- Converts mouse position to normalized coordinates (-1 to 1)
- Smoothly interpolates tilt angles for natural movement
- Updates physics gravity direction based on tilt

**Wall Collision** (labyrinth.js:194-213):
- Each wall has both a Three.js mesh (visual) and Cannon.js body (physics)
- Physics engine automatically prevents ball from passing through walls
- Contact materials define friction and bounce

**Hole Detection** (labyrinth.js:340-364):
- Checks distance between ball and each hole
- Triggers game over when ball enters hole radius
- Detects if ball falls below world threshold

**Random Hole Generation** (labyrinth.js:215-251):
- Generates holes at random positions within safe maze bounds
- Creates visual representation with emissive materials
- Adds glowing rings for better visibility

## 📁 File Structure

```
Tilt-Labyrinth/
├── index.html          # Full-screen game container
├── styles.css          # Full-screen styling with overlays
├── labyrinth.js        # Complete game logic with physics
└── README.md           # Documentation
```

## 🎨 Customization

You can easily customize the game by modifying these parameters in `labyrinth.js`:

```javascript
// Maze configuration
this.mazeSize = 300;           // Overall maze size
this.wallThickness = 6;        // Wall width
this.wallHeight = 40;          // Wall height
this.maxTilt = 0.15;          // Maximum tilt angle

// Ball configuration
this.sphereRadius = 8;         // Ball size

// Hole configuration
this.holeRadius = 12;          // Hole size
this.numberOfHoles = 6;        // Number of holes

// Physics configuration (line 73-75)
this.world.gravity.set(0, -30, 0);  // Gravity strength
```

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires WebGL support and modern JavaScript features.

## 🎯 Gameplay Tips

1. **Gentle Movements**: Small mouse movements create subtle tilts for precise control
2. **Momentum**: The ball carries momentum - plan your path ahead
3. **Wall Bouncing**: Use walls to redirect the ball's movement
4. **Hole Awareness**: Keep track of hole positions as you navigate
5. **Practice**: Each restart gives you new hole positions to master

## 🔧 Future Enhancement Ideas

- Multiple difficulty levels (more holes, smaller ball)
- Timer and scoring system
- Goal/finish line to reach
- Power-ups and collectibles
- Mobile touch controls
- Procedurally generated maze layouts

## 📝 License

MIT License - Feel free to use, modify, and distribute!

---

**Have fun navigating the maze!** 🎮
