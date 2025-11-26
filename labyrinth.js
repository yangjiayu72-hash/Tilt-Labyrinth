// 3D Mouse-Controlled Maze Game with Physics
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
        this.mazeSize = 300;
        this.wallThickness = 6;
        this.wallHeight = 40;
        this.sphereRadius = 8;
        this.maxTilt = 0.15; // Maximum tilt angle in radians

        // Hole configuration
        this.holeRadius = 12;
        this.numberOfHoles = 6;

        this.init();
        this.createHoles();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 300, 600);

        // Setup camera
        const canvas = document.getElementById('labyrinthCanvas');
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 350, 350);
        this.camera.lookAt(0, 0, 0);

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
        this.world.gravity.set(0, -30, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;

        // Add lights
        this.addLights();

        // Create maze
        this.createMaze();

        // Create sphere
        this.createSphere();
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(150, 300, 150);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.left = -250;
        mainLight.shadow.camera.right = 250;
        mainLight.shadow.camera.top = 250;
        mainLight.shadow.camera.bottom = -250;
        this.scene.add(mainLight);

        // Accent lights
        const purpleLight = new THREE.PointLight(0x764ba2, 1, 400);
        purpleLight.position.set(-100, 100, -100);
        this.scene.add(purpleLight);

        const blueLight = new THREE.PointLight(0x667eea, 1, 400);
        blueLight.position.set(100, 100, 100);
        this.scene.add(blueLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x667eea, 0.5);
        rimLight.position.set(-150, 100, -150);
        this.scene.add(rimLight);
    }

    createMaze() {
        this.mazeGroup = new THREE.Group();

        // Material for maze floor and walls
        const mazeMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.3,
            roughness: 0.6
        });

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            metalness: 0.4,
            roughness: 0.5
        });

        // Physics material
        const physicsMaterial = new CANNON.Material();

        // Create floor (will have holes cut into it)
        const floorGeometry = new THREE.BoxGeometry(this.mazeSize, 4, this.mazeSize);
        const floor = new THREE.Mesh(floorGeometry, mazeMaterial);
        floor.position.y = -2;
        floor.receiveShadow = true;
        floor.castShadow = true;
        this.mazeGroup.add(floor);

        // Floor physics (will be a plane for now, holes handled separately)
        const floorShape = new CANNON.Box(new CANNON.Vec3(this.mazeSize / 2, 2, this.mazeSize / 2));
        const floorBody = new CANNON.Body({
            mass: 0,
            material: physicsMaterial,
            shape: floorShape
        });
        floorBody.position.set(0, -2, 0);
        this.world.addBody(floorBody);
        this.wallBodies.push(floorBody);

        // Create outer walls
        this.createWall(0, this.wallHeight / 2, -this.mazeSize / 2, this.mazeSize, this.wallHeight, this.wallThickness, wallMaterial, physicsMaterial);
        this.createWall(0, this.wallHeight / 2, this.mazeSize / 2, this.mazeSize, this.wallHeight, this.wallThickness, wallMaterial, physicsMaterial);
        this.createWall(-this.mazeSize / 2, this.wallHeight / 2, 0, this.wallThickness, this.wallHeight, this.mazeSize, wallMaterial, physicsMaterial);
        this.createWall(this.mazeSize / 2, this.wallHeight / 2, 0, this.wallThickness, this.wallHeight, this.mazeSize, wallMaterial, physicsMaterial);

        // Create inner maze walls for complexity
        const innerWalls = [
            // Horizontal walls
            { x: -80, z: -80, width: 100, height: this.wallHeight, depth: this.wallThickness },
            { x: 40, z: -50, width: 120, height: this.wallHeight, depth: this.wallThickness },
            { x: -60, z: 20, width: 80, height: this.wallHeight, depth: this.wallThickness },
            { x: 60, z: 60, width: 100, height: this.wallHeight, depth: this.wallThickness },

            // Vertical walls
            { x: -50, z: -40, width: this.wallThickness, height: this.wallHeight, depth: 100 },
            { x: 20, z: 30, width: this.wallThickness, height: this.wallHeight, depth: 120 },
            { x: 80, z: -70, width: this.wallThickness, height: this.wallHeight, depth: 80 },
            { x: -100, z: 70, width: this.wallThickness, height: this.wallHeight, depth: 90 }
        ];

        innerWalls.forEach(wall => {
            this.createWall(
                wall.x,
                this.wallHeight / 2,
                wall.z,
                wall.width,
                wall.height,
                wall.depth,
                wallMaterial,
                physicsMaterial
            );
        });

        this.scene.add(this.mazeGroup);
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
        // Create random holes on the floor
        for (let i = 0; i < this.numberOfHoles; i++) {
            const x = (Math.random() - 0.5) * (this.mazeSize - 80);
            const z = (Math.random() - 0.5) * (this.mazeSize - 80);

            // Visual hole (dark circle)
            const holeGeometry = new THREE.CylinderGeometry(this.holeRadius, this.holeRadius, 1, 32);
            const holeMaterial = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0xff4757,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.position.set(x, 0, z);
            hole.rotation.x = Math.PI / 2;
            this.mazeGroup.add(hole);

            // Store hole position for collision detection
            this.holes.push({ x, z, radius: this.holeRadius });

            // Add glowing ring around hole
            const ringGeometry = new THREE.RingGeometry(this.holeRadius, this.holeRadius + 2, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4757,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(x, 0.5, z);
            ring.rotation.x = -Math.PI / 2;
            this.mazeGroup.add(ring);
        }
    }

    createSphere() {
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
        this.sphereBody.position.set(0, 50, 0);
        this.world.addBody(this.sphereBody);

        // Contact material between sphere and maze
        const contactMaterial = new CANNON.ContactMaterial(
            this.sphereBody.material,
            this.wallBodies[0].material,
            {
                friction: 0.3,
                restitution: 0.4
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
        const gravityStrength = 30;
        this.world.gravity.set(
            Math.sin(this.currentTilt.z) * gravityStrength,
            -gravityStrength,
            -Math.sin(this.currentTilt.x) * gravityStrength
        );
    }

    checkHoleCollision() {
        const spherePos = this.sphereBody.position;

        // Check if sphere is near floor level
        if (spherePos.y < 10 && spherePos.y > -5) {
            for (let hole of this.holes) {
                const dx = spherePos.x - hole.x;
                const dz = spherePos.z - hole.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance < hole.radius - 2) {
                    this.triggerGameOver();
                    return true;
                }
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

        // Reset sphere position and velocity
        this.sphereBody.position.set(0, 50, 0);
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
            if (child.geometry && (child.geometry.type === 'CylinderGeometry' || child.geometry.type === 'RingGeometry')) {
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
