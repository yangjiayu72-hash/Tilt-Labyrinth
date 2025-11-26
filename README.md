# 3D Multi-Level Mouse Maze

An immersive full-screen 3D maze game with multiple vertical levels! Control the ball's movement by tilting the maze with your mouse. Navigate through 4 different platform levels connected by ramps while avoiding dangerous holes!

## 🎮 Game Features

### Core 3D Mechanics
- **True 3D Multi-Level Maze**: 4 distinct platform levels at different heights
- **Mouse-Controlled Tilt**: Move your mouse to tilt the entire 3D structure
- **Physics-Based Movement**: Realistic ball physics with gravity, friction, and momentum
- **Vertical Navigation**: Ball can roll up/down ramps between levels and fall from platforms
- **Wall Collision**: The ball cannot pass through walls on any level
- **3D Holes**: 8 holes randomly placed across all 4 levels (3 bottom, 2 mid-low, 2 mid-high, 1 top)
- **Fall Detection**: Falling into a hole at any level triggers game over
- **Dynamic Restart**: Holes regenerate in new random positions each restart

### 3D Level Structure
- **Level 0 (Bottom)**: 300x300 platform at ground level
- **Level 1 (Mid-Low)**: 250x250 platform at +40 height
- **Level 2 (Mid-High)**: 200x200 platform at +80 height
- **Level 3 (Top)**: 150x150 platform at +120 height
- **Connecting Ramps**: Blue ramps link each level for vertical navigation

### Visual Features
- **Full-Screen 3D Experience**: Immersive gameplay filling entire viewport
- **Dynamic Camera**: Follows the ball smoothly through 3D space
- **Multi-Level Depth**: Clearly visible platform layers with glowing edges
- **Glowing Holes**: Red emissive holes with torus rings and particle effects
- **Realistic Lighting**: Ambient, directional, and colored point lights (purple & blue)
- **Metallic Ball**: Shiny reflective sphere with PBR materials
- **Shadow Mapping**: Real-time shadows showing depth on all levels
- **Transparent Boundary Walls**: Semi-transparent outer walls for visibility

### Controls
- **Mouse Movement**: Tilt the maze (move mouse around screen)
- **R Key**: Restart the game at any time
- **Restart Button**: Click to restart after game over

## 🚀 How to Play

1. Open `index.html` in a modern web browser
2. The ball starts at the top level (Level 3)
3. Move your mouse to tilt the entire 3D maze structure
4. Guide the ball down through the levels using ramps
5. Navigate carefully around the glowing red holes on each level
6. If you fall into a hole, press R or click "Restart" to try again with new hole positions

## 🎯 Game Objective

Navigate the ball through the 3D multi-level maze structure without falling into any holes. The ball can travel between levels via ramps, creating a true 3D navigation challenge. Each restart randomizes hole positions across all 4 levels!

## 🛠️ Technical Implementation

### Technologies
- **Three.js (r128)**: 3D graphics rendering engine
- **Cannon.js (0.6.2)**: Physics engine for realistic ball movement
- **WebGL**: Hardware-accelerated 3D graphics
- **ES6 JavaScript**: Modern JavaScript with classes

### 3D Architecture
```
Multi-Level Structure
├── Level 3 (Top): 150x150 @ y=120
│   └── 1 hole
├── Ramp 3 (connects Level 2 → 3)
├── Level 2 (Mid-High): 200x200 @ y=80
│   └── 2 holes
├── Ramp 2 (connects Level 1 → 2)
├── Level 1 (Mid-Low): 250x250 @ y=40
│   └── 2 holes
├── Ramp 1 (connects Level 0 → 1)
└── Level 0 (Bottom): 300x300 @ y=0
    └── 3 holes
```

### Physics System
- **Gravity**: Dynamic gravity (40 units) that changes based on maze tilt
- **3D Collision**: Physics bodies for platforms, walls, and ramps at all heights
- **Ramp Physics**: Angled collision boxes for smooth ball rolling between levels
- **Damping**: Linear (0.3) and angular (0.3) damping for realistic behavior
- **Contact Materials**: Custom friction (0.4) and restitution (0.3) for ball-surface interaction

### Key Features Implementation

**Multi-Level Platforms** (labyrinth.js:151-205):
- 4 platforms at different heights with varying sizes
- Each level has unique color and glowing edge highlights
- Physics bodies match visual geometry exactly
- Smaller platforms at higher levels create increased difficulty

**Connecting Ramps** (labyrinth.js:207-238):
- Angled geometry between vertical levels
- Physics quaternion rotation for proper collision angles
- Blue material for easy identification
- Ball can roll up/down smoothly

**3D Wall System** (labyrinth.js:264-321):
- Walls at different heights (y positions)
- Walls specific to each level create 3D pathways
- Transparent boundary walls contain the entire structure
- Full physics collision on all walls

**Multi-Level Holes** (labyrinth.js:323-385):
- Holes distributed across all 4 levels
- 3D position tracking (x, y, z)
- Torus ring indicators for better visibility
- Particle effects (floating cubes) above each hole

**Dynamic Camera** (labyrinth.js:573-581):
- Follows ball position in 3D space
- Smooth interpolation for cinematic movement
- Adjusts height based on ball's vertical position
- Always points at ball for optimal viewing

## 📁 File Structure

```
Tilt-Labyrinth/
├── index.html          # Full-screen game with loading screen
├── styles.css          # Full viewport styling with overlays
├── labyrinth.js        # Complete 3D multi-level game logic (622 lines)
└── README.md           # This documentation
```

## 🎨 Customization

Modify these parameters in `labyrinth.js` to customize the game:

```javascript
// Level structure (lines 36-41)
this.levels = [
    { y: 0, size: 300 },      // Bottom level
    { y: 40, size: 250 },     // Mid-low level
    { y: 80, size: 200 },     // Mid-high level
    { y: 120, size: 150 }     // Top level
];

// Maze configuration
this.mazeSize = 400;           // Overall boundary size
this.wallThickness = 5;        // Wall width
this.wallHeight = 35;          // Wall height per level
this.maxTilt = 0.2;           // Maximum tilt angle

// Ball configuration
this.sphereRadius = 8;         // Ball size

// Hole configuration
this.holeRadius = 15;          // Hole size
this.numberOfHoles = 8;        // Total holes across all levels

// Physics (lines 82-85)
this.world.gravity.set(0, -40, 0);     // Gravity strength
this.world.solver.iterations = 15;     // Physics precision
```

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires WebGL support and modern JavaScript features.

## 🎯 Gameplay Tips

1. **Start High, Go Low**: Ball begins at top level - guide it down carefully
2. **Use Ramps**: Blue ramps are your pathways between levels
3. **Watch Your Speed**: Ball gains momentum falling between levels
4. **Platform Edges**: Glowing blue edges mark platform boundaries
5. **Hole Distribution**: More holes on lower levels = higher difficulty
6. **Camera Follows**: Camera tracks the ball automatically in 3D
7. **Tilt Gradually**: Small mouse movements for precise control
8. **Level Awareness**: Keep track of which level you're on

## 🔧 3D Features

- ✅ 4 distinct vertical platform levels
- ✅ 3 connecting ramps for vertical navigation
- ✅ Walls at multiple heights creating 3D pathways
- ✅ Holes distributed across all levels
- ✅ Ball can fall from higher platforms
- ✅ True 3D physics simulation
- ✅ Dynamic camera following ball in 3D space
- ✅ Depth perception through lighting and shadows
- ✅ Transparent outer walls for visibility
- ✅ Glowing platform edges showing level structure

## 🎮 Advanced Strategies

1. **Top-Down Navigation**: Plan your route from top to bottom
2. **Ramp Positioning**: Memorize ramp locations for efficient descent
3. **Momentum Control**: Use tilt to control speed on ramps
4. **Level Holes**: Note hole positions on each level during descent
5. **Edge Safety**: Stay away from platform edges to avoid falls

## 📝 License

MIT License - Feel free to use, modify, and distribute!

---

**Navigate the vertical labyrinth!** 🎮
