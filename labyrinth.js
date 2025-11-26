// 3D Multi-Level Maze Game with Physics
class MouseMaze {
    constructor() {
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sphere = null;
        this.mazeGroup = null;

        // Physics world
        this.world = null;
        this.sphereBody = null;
        this.wallBodies = [];
        this.platformBodies = [];
        this.holes = [];

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetTilt = { x: 0, z: 0 };
        this.currentTilt = { x: 0, z: 0 };

        // Game state
        this.gameOver = false;
        this.isPlaying = true;

        // Maze dimensions
        this.mazeSize = 400;
        this.wallThickness = 5;
        this.wallHeight = 35;
        this.sphereRadius = 8;
        this.maxTilt = 0.2; // Maximum tilt angle in radians

        // 3D Level configuration
        this.levels = [
            { y: 0, size: 300 },      // Bottom level
            { y: 40, size: 250 },     // Mid-low level
            { y: 80, size: 200 },     // Mid-high level
            { y: 120, size: 150 }     // Top level
        ];

        // Hole configuration
        this.holeRadius = 15;
        this.numberOfHoles = 8;

        this.init();
        this.createMultiLevelMaze();
        this.createHoles();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 400, 800);

        // Setup camera with better 3D perspective
        const canvas = document.getElementById('labyrinthCanvas');
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(300, 400, 300);
        this.camera.lookAt(0, 60, 0);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -40, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 15;

        // Add lights
        this.addLights();

        this.mazeGroup = new THREE.Group();
        this.scene.add(this.mazeGroup);
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light from top
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(200, 500, 200);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.left = -300;
        mainLight.shadow.camera.right = 300;
        mainLight.shadow.camera.top = 300;
        mainLight.shadow.camera.bottom = -300;
        mainLight.shadow.camera.near = 100;
        mainLight.shadow.camera.far = 800;
        this.scene.add(mainLight);

        // Accent lights for depth
        const purpleLight = new THREE.PointLight(0x764ba2, 1.5, 500);
        purpleLight.position.set(-150, 150, -150);
        this.scene.add(purpleLight);

        const blueLight = new THREE.PointLight(0x667eea, 1.5, 500);
        blueLight.position.set(150, 150, 150);
        this.scene.add(blueLight);

        // Bottom rim light
        const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.4);
        rimLight.position.set(-200, 50, -200);
        this.scene.add(rimLight);
    }

    createMultiLevelMaze() {
        const physicsMaterial = new CANNON.Material();

        // Create platforms at different heights
        this.levels.forEach((level, index) => {
            this.createPlatformLevel(level.y, level.size, index, physicsMaterial);
        });

        // Create connecting ramps between levels
        this.createRamp(-80, 0, -80, 40, 60, 1);
        this.createRamp(60, 40, 60, 80, 60, 2);
        this.createRamp(-50, 80, 50, 120, 50, 3);

        // Create outer boundary walls
        this.createBoundaryWalls(physicsMaterial);

        // Create 3D inner maze walls at various heights
        this.create3DInnerWalls(physicsMaterial);

        // Create sphere
        this.createSphere(physicsMaterial);
    }

    createPlatformLevel(yPos, size, levelIndex, physicsMaterial) {
        // Platform appearance varies by level
        const colors = [0x2c3e50, 0x34495e, 0x3d566e, 0x495f7e];
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: colors[levelIndex],
            metalness: 0.3,
            roughness: 0.6
        });

        // Main platform
        const platformThickness = 4;
        const platformGeometry = new THREE.BoxGeometry(size, platformThickness, size);
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, yPos - platformThickness / 2, 0);
        platform.receiveShadow = true;
        platform.castShadow = true;
        this.mazeGroup.add(platform);

        // Physics platform
        const platformShape = new CANNON.Box(new CANNON.Vec3(size / 2, platformThickness / 2, size / 2));
        const platformBody = new CANNON.Body({
            mass: 0,
            material: physicsMaterial,
            shape: platformShape
        });
        platformBody.position.set(0, yPos - platformThickness / 2, 0);
        this.world.addBody(platformBody);
        this.platformBodies.push({ body: platformBody, y: yPos, size: size });

        // Add decorative edges to platforms
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            metalness: 0.5,
            roughness: 0.4,
            emissive: 0x667eea,
            emissiveIntensity: 0.2
        });

        // Create edge highlights
        const edgeThickness = 2;
        const edges = [
            { pos: [0, yPos, -size / 2], size: [size, edgeThickness, edgeThickness] },
            { pos: [0, yPos, size / 2], size: [size, edgeThickness, edgeThickness] },
            { pos: [-size / 2, yPos, 0], size: [edgeThickness, edgeThickness, size] },
            { pos: [size / 2, yPos, 0], size: [edgeThickness, edgeThickness, size] }
        ];

        edges.forEach(edge => {
            const edgeGeometry = new THREE.BoxGeometry(...edge.size);
            const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edgeMesh.position.set(...edge.pos);
            edgeMesh.castShadow = true;
            this.mazeGroup.add(edgeMesh);
        });
    }

    createRamp(x, fromY, z, toY, length, index) {
        const rampMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.4,
            roughness: 0.5
        });

        const rampWidth = 30;
        const rampThickness = 4;
        const heightDiff = toY - fromY;
        const angle = Math.atan2(heightDiff, length);

        // Visual ramp
        const rampGeometry = new THREE.BoxGeometry(rampWidth, rampThickness, length);
        const ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        ramp.position.set(x, (fromY + toY) / 2, z);
        ramp.rotation.x = -angle;
        ramp.castShadow = true;
        ramp.receiveShadow = true;
        this.mazeGroup.add(ramp);

        // Physics ramp
        const rampShape = new CANNON.Box(new CANNON.Vec3(rampWidth / 2, rampThickness / 2, length / 2));
        const rampBody = new CANNON.Body({
            mass: 0,
            shape: rampShape
        });
        rampBody.position.set(x, (fromY + toY) / 2, z);
        rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -angle);
        this.world.addBody(rampBody);
        this.wallBodies.push(rampBody);
    }

    createBoundaryWalls(physicsMaterial) {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.4,
            roughness: 0.5,
            transparent: true,
            opacity: 0.7
        });

        const boundarySize = this.mazeSize / 2 + 20;
        const boundaryHeight = 180;

        const walls = [
            { x: 0, z: -boundarySize, width: boundarySize * 2, depth: this.wallThickness },
            { x: 0, z: boundarySize, width: boundarySize * 2, depth: this.wallThickness },
            { x: -boundarySize, z: 0, width: this.wallThickness, depth: boundarySize * 2 },
            { x: boundarySize, z: 0, width: this.wallThickness, depth: boundarySize * 2 }
        ];

        walls.forEach(wall => {
            this.createWall(wall.x, boundaryHeight / 2, wall.z, wall.width, boundaryHeight, wall.depth, wallMaterial, physicsMaterial);
        });
    }

    create3DInnerWalls(physicsMaterial) {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            metalness: 0.4,
            roughness: 0.5
        });

        // Walls at different heights creating 3D maze structure
        const innerWalls = [
            // Level 0 walls
            { x: -60, y: 18, z: -60, width: 80, height: 35, depth: this.wallThickness },
            { x: 50, y: 18, z: -80, width: 100, height: 35, depth: this.wallThickness },
            { x: -80, y: 18, z: 40, width: this.wallThickness, height: 35, depth: 100 },
            { x: 70, y: 18, z: 60, width: this.wallThickness, height: 35, depth: 80 },

            // Level 1 walls (mid-low)
            { x: -40, y: 60, z: -40, width: 70, height: 40, depth: this.wallThickness },
            { x: 40, y: 60, z: 30, width: 80, height: 40, depth: this.wallThickness },
            { x: 30, y: 60, z: -50, width: this.wallThickness, height: 40, depth: 70 },
            { x: -60, y: 60, z: 50, width: this.wallThickness, height: 40, depth: 60 },

            // Level 2 walls (mid-high)
            { x: -30, y: 100, z: -30, width: 60, height: 40, depth: this.wallThickness },
            { x: 30, y: 100, z: 20, width: 60, height: 40, depth: this.wallThickness },
            { x: 20, y: 100, z: -40, width: this.wallThickness, height: 40, depth: 50 },
            { x: -40, y: 100, z: 35, width: this.wallThickness, height: 40, depth: 50 },

            // Level 3 walls (top)
            { x: 0, y: 140, z: -20, width: 50, height: 40, depth: this.wallThickness },
            { x: -15, y: 140, z: 15, width: this.wallThickness, height: 40, depth: 50 },
            { x: 20, y: 140, z: 0, width: this.wallThickness, height: 40, depth: 40 }
        ];

        innerWalls.forEach(wall => {
            this.createWall(wall.x, wall.y, wall.z, wall.width, wall.height, wall.depth, wallMaterial, physicsMaterial);
        });
    }

    createWall(x, y, z, width, height, depth, material, physicsMaterial) {
        // Visual wall
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.mazeGroup.add(wall);

        // Physics wall
        const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const wallBody = new CANNON.Body({
            mass: 0,
            material: physicsMaterial,
            shape: wallShape
        });
        wallBody.position.set(x, y, z);
        this.world.addBody(wallBody);
        this.wallBodies.push(wallBody);
    }

    createHoles() {
        // Create holes on different levels
        const holesPerLevel = [3, 2, 2, 1]; // Distribution across levels

        let holeIndex = 0;
        this.levels.forEach((level, levelIndex) => {
            const numHoles = holesPerLevel[levelIndex];
            const safeMargin = 40;

            for (let i = 0; i < numHoles && holeIndex < this.numberOfHoles; i++) {
                const x = (Math.random() - 0.5) * (level.size - safeMargin);
                const z = (Math.random() - 0.5) * (level.size - safeMargin);
                const y = level.y;

                // Visual hole (glowing pit)
                const holeGeometry = new THREE.CylinderGeometry(this.holeRadius, this.holeRadius * 0.8, 3, 32);
                const holeMaterial = new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: 0xff4757,
                    emissiveIntensity: 0.5,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const hole = new THREE.Mesh(holeGeometry, holeMaterial);
                hole.position.set(x, y, z);
                this.mazeGroup.add(hole);

                // Store hole position for collision detection
                this.holes.push({ x, y, z, radius: this.holeRadius });

                // Add glowing ring around hole
                const ringGeometry = new THREE.TorusGeometry(this.holeRadius + 2, 1.5, 16, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff4757,
                    transparent: true,
                    opacity: 0.7
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.set(x, y, z);
                ring.rotation.x = Math.PI / 2;
                this.mazeGroup.add(ring);

                // Add particle effect (small cubes floating above hole)
                for (let j = 0; j < 3; j++) {
                    const particleGeometry = new THREE.BoxGeometry(2, 2, 2);
                    const particleMaterial = new THREE.MeshBasicMaterial({
                        color: 0xff4757,
                        transparent: true,
                        opacity: 0.6
                    });
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    particle.position.set(
                        x + (Math.random() - 0.5) * 10,
                        y + 5 + j * 5,
                        z + (Math.random() - 0.5) * 10
                    );
                    this.mazeGroup.add(particle);
                }

                holeIndex++;
            }
        });
    }

    createSphere(physicsMaterial) {
        // Visual sphere
        const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xecf0f1,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1
        });

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        this.scene.add(this.sphere);

        // Physics sphere
        const sphereShape = new CANNON.Sphere(this.sphereRadius);
        this.sphereBody = new CANNON.Body({
            mass: 1,
            shape: sphereShape,
            linearDamping: 0.3,
            angularDamping: 0.3
        });
        this.sphereBody.position.set(0, 150, 0); // Start at top level
        this.world.addBody(this.sphereBody);

        // Contact material between sphere and maze
        const contactMaterial = new CANNON.ContactMaterial(
            this.sphereBody.material,
            physicsMaterial,
            {
                friction: 0.4,
                restitution: 0.3
            }
        );
        this.world.addContactMaterial(contactMaterial);
    }

    setupEventListeners() {
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            }
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateMazeTilt() {
        // Smooth tilt based on mouse position
        this.targetTilt.x = this.mouseY * this.maxTilt;
        this.targetTilt.z = -this.mouseX * this.maxTilt;

        // Smooth interpolation
        this.currentTilt.x += (this.targetTilt.x - this.currentTilt.x) * 0.1;
        this.currentTilt.z += (this.targetTilt.z - this.currentTilt.z) * 0.1;

        // Apply tilt to maze
        this.mazeGroup.rotation.x = this.currentTilt.x;
        this.mazeGroup.rotation.z = this.currentTilt.z;

        // Update physics world gravity based on tilt
        const gravityStrength = 40;
        this.world.gravity.set(
            Math.sin(this.currentTilt.z) * gravityStrength,
            -gravityStrength,
            -Math.sin(this.currentTilt.x) * gravityStrength
        );
    }

    checkHoleCollision() {
        const spherePos = this.sphereBody.position;

        // Check collision with holes at any level
        for (let hole of this.holes) {
            const dx = spherePos.x - hole.x;
            const dy = spherePos.y - hole.y;
            const dz = spherePos.z - hole.z;
            const distance2D = Math.sqrt(dx * dx + dz * dz);

            // Check if sphere is near the hole's level and within radius
            if (Math.abs(dy) < this.sphereRadius + 5 && distance2D < hole.radius - 3) {
                this.triggerGameOver();
                return true;
            }
        }

        // Check if sphere fell off the world
        if (spherePos.y < -50) {
            this.triggerGameOver();
            return true;
        }

        return false;
    }

    triggerGameOver() {
        if (this.gameOver) return;

        this.gameOver = true;
        this.isPlaying = false;

        // Show game over screen
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('instructions').classList.add('hidden');
    }

    restart() {
        // Reset game state
        this.gameOver = false;
        this.isPlaying = true;

        // Hide game over screen
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('instructions').classList.remove('hidden');

        // Reset sphere position to top level
        this.sphereBody.position.set(0, 150, 0);
        this.sphereBody.velocity.set(0, 0, 0);
        this.sphereBody.angularVelocity.set(0, 0, 0);

        // Reset maze tilt
        this.currentTilt = { x: 0, z: 0 };
        this.targetTilt = { x: 0, z: 0 };
        this.mazeGroup.rotation.x = 0;
        this.mazeGroup.rotation.z = 0;

        // Regenerate holes in new positions
        this.regenerateHoles();
    }

    regenerateHoles() {
        // Remove old holes from scene
        const holeMeshes = [];
        this.mazeGroup.children.forEach(child => {
            if (child.geometry && (
                child.geometry.type === 'CylinderGeometry' ||
                child.geometry.type === 'TorusGeometry' ||
                (child.geometry.type === 'BoxGeometry' && child.material.transparent && child.material.opacity === 0.6)
            )) {
                holeMeshes.push(child);
            }
        });
        holeMeshes.forEach(mesh => this.mazeGroup.remove(mesh));

        // Clear holes array
        this.holes = [];

        // Create new holes
        this.createHoles();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isPlaying) {
            // Update physics
            this.world.step(1 / 60);

            // Update maze tilt
            this.updateMazeTilt();

            // Sync sphere visual with physics
            this.sphere.position.copy(this.sphereBody.position);
            this.sphere.quaternion.copy(this.sphereBody.quaternion);

            // Check for hole collisions
            this.checkHoleCollision();

            // Dynamic camera following ball with smooth interpolation
            const targetCameraX = this.sphere.position.x * 0.3 + 300;
            const targetCameraY = this.sphere.position.y * 0.5 + 350;
            const targetCameraZ = this.sphere.position.z * 0.3 + 300;

            this.camera.position.x += (targetCameraX - this.camera.position.x) * 0.02;
            this.camera.position.y += (targetCameraY - this.camera.position.y) * 0.02;
            this.camera.position.z += (targetCameraZ - this.camera.position.z) * 0.02;
            this.camera.lookAt(this.sphere.position);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Check if required libraries are loaded
    if (typeof THREE === 'undefined') {
        console.error('THREE.js failed to load');
        alert('Error: THREE.js library failed to load. Please refresh the page.');
        return;
    }

    if (typeof CANNON === 'undefined') {
        console.error('CANNON.js failed to load');
        alert('Error: CANNON.js library failed to load. Please refresh the page.');
        return;
    }

    console.log('Libraries loaded successfully. Starting game...');

    try {
        const game = new MouseMaze();
        console.log('Game initialized successfully!');

        // Hide loading screen
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        const loadingScreen = document.getElementById('loading');
        if (loadingScreen) {
            loadingScreen.innerHTML = '<h1>ERROR</h1><p>' + error.message + '</p><p class="small">Check console for details</p>';
        }
    }
});
