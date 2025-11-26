# 3D Tilt Labyrinth

An interactive 3D floating labyrinth game built with Three.js, featuring a reflective metal sphere that navigates through a maze using tilt mechanics.

## Features

### 🎮 Core Mechanics
- **3D Floating Labyrinth**: 6-wall maze structure with open top/bottom for visible depth layers
- **Reflective Metal Sphere**: 18mm diameter sphere with metallic reflections
- **4-Step Tilt Interaction**: Progressive movement system where each tilt advances the sphere through the maze
- **Dynamic Speed**: Sphere speed increases with each tilt (30% faster per tilt)

### ✨ Special 4th Tilt Sequence
When the sphere reaches the center on the 4th tilt, a special animation sequence triggers:
1. **Maze Drop**: Entire maze drops 8% down with 0.2s buffer easing
2. **Sphere Launch**: Sphere launches upward 12%
3. **Orbit Animation**: Sphere orbits 2 complete loops around the maze exterior at 12% radius
4. **Center Settlement**: Sphere settles back to the central black disk

### 🎥 Camera & Controls
- Camera locked at 25° top-tilt angle for optimal viewing
- Orbit controls remain active after completion
- Smooth camera movements with damping

## Technical Implementation

### Structure
- **Maze Dimensions**: 200x200 units with 30-unit wall height
- **Wall Thickness**: 4 units for optimal visibility
- **Sphere Radius**: 9 units (18mm diameter)
- **Material**: PBR materials with metalness and roughness

### Path System
Each of the 4 tilts follows a predefined path:
- **Tilt 1**: Entrance to first corner (2 segments)
- **Tilt 2**: Navigate through second section (3 segments)
- **Tilt 3**: Approach center area (3 segments)
- **Tilt 4**: Final path to center (3 segments)

### Animation Easing
- Standard movements: Ease-in-out quadratic
- Maze drop: Ease-in-out cubic for smooth buffer effect
- Sphere launch: Ease-out cubic for natural physics
- Orbit: Linear for consistent rotation speed

## File Structure

```
Tilt-Labyrinth/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── labyrinth.js        # Three.js game logic
└── README.md           # Documentation
```

## Usage

1. Open `index.html` in a modern web browser
2. Use the tilt buttons (↑ ↓ ← →) to move the sphere
3. Complete 4 tilts to reach the center and trigger the special sequence
4. Click "Reset" to start over

## Technologies

- **Three.js (r128)**: 3D rendering and scene management
- **OrbitControls**: Camera control system
- **WebGL**: Hardware-accelerated graphics
- **CSS3**: Modern styling with gradients and animations

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Controls

- **Tilt Buttons**: Move the sphere through the maze
- **Mouse Drag**: Rotate camera view (orbit controls)
- **Mouse Wheel**: Zoom in/out
- **Reset Button**: Restart the game

## Configuration

Key parameters in `labyrinth.js`:
```javascript
mazeSize: 200           // Overall maze dimensions
wallThickness: 4        // Wall width
wallHeight: 30          // Wall height
sphereRadius: 9         // Sphere size (18mm diameter)
```

## Final State

After completing the 4th tilt sequence:
- ✓ 3D maze remains intact at dropped position
- ✓ Camera locked at 25° top-tilt angle
- ✓ Orbit controls active and responsive
- ✓ Sphere static at central black disk
- ✓ No geometry overlaps

## License

MIT License - Feel free to use and modify!
