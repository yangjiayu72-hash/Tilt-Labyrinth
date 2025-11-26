// 3D Tilt Labyrinth Game
class TiltLabyrinth {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.sphere = null;
        this.maze = null;
        this.mazeGroup = null;

        // State
        this.tiltCount = 0;
        this.isAnimating = false;
        this.sphereVelocity = new THREE.Vector3();
        this.currentPath = [];
        this.pathIndex = 0;

        // Maze dimensions
        this.mazeSize = 200;
        this.wallThickness = 4;
        this.wallHeight = 30;
        this.sphereRadius = 9; // 18mm diameter = 9mm radius

        // Paths for each tilt (positions the sphere should move through)
        this.tiltPaths = [
            // Tilt 1: Start to first corner
            [
                new THREE.Vector3(-70, 0, -70), // entrance
                new THREE.Vector3(-40, 0, -70),
                new THREE.Vector3(-40, 0, -40)
            ],
            // Tilt 2: Navigate through second section
            [
                new THREE.Vector3(-40, 0, -40),
                new THREE.Vector3(-10, 0, -40),
                new THREE.Vector3(-10, 0, -10),
                new THREE.Vector3(10, 0, -10)
            ],
            // Tilt 3: Approach center area
            [
                new THREE.Vector3(10, 0, -10),
                new THREE.Vector3(10, 0, 20),
                new THREE.Vector3(30, 0, 20),
                new THREE.Vector3(30, 0, 40)
            ],
            // Tilt 4: Final path to center
            [
                new THREE.Vector3(30, 0, 40),
                new THREE.Vector3(15, 0, 40),
                new THREE.Vector3(15, 0, 15),
                new THREE.Vector3(0, 0, 0) // center
            ]
        ];

        this.init();
        this.animate();
    }

    init() {
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 200, 500);

        // Setup camera with 25° top-tilt
        const canvas = document.getElementById('labyrinthCanvas');
        this.camera = new THREE.PerspectiveCamera(
            45,
            800 / 600,
            0.1,
            1000
        );
        this.camera.position.set(0, 250, 250);
        this.camera.lookAt(0, 0, 0);

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(800, 600);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup orbit controls with 25° lock
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 200;
        this.controls.maxDistance = 400;
        this.controls.maxPolarAngle = Math.PI / 2.2; // ~25° from top
        this.controls.minPolarAngle = Math.PI / 3;
        this.controls.target.set(0, 0, 0);

        // Add lights
        this.addLights();

        // Create maze
        this.createMaze();

        // Create sphere
        this.createSphere();

        // Setup UI
        this.setupUI();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(100, 200, 100);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 500;
        mainLight.shadow.camera.left = -200;
        mainLight.shadow.camera.right = 200;
        mainLight.shadow.camera.top = 200;
        mainLight.shadow.camera.bottom = -200;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x7B68EE, 0.4);
        fillLight.position.set(-100, 100, -100);
        this.scene.add(fillLight);

        // Point light for sphere reflection
        const pointLight = new THREE.PointLight(0xffffff, 0.6, 300);
        pointLight.position.set(0, 100, 0);
        this.scene.add(pointLight);
    }

    createMaze() {
        this.mazeGroup = new THREE.Group();

        // Create base platform (visible through open top/bottom)
        const baseGeometry = new THREE.BoxGeometry(this.mazeSize, 2, this.mazeSize);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d3436,
            metalness: 0.3,
            roughness: 0.7
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -this.wallHeight / 2 - 1;
        base.receiveShadow = true;
        this.mazeGroup.add(base);

        // Wall material
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            metalness: 0.4,
            roughness: 0.6,
            transparent: true,
            opacity: 0.85
        });

        // Create 6 outer walls (North, South, East, West, and 2 support walls)
        // North wall
        this.createWall(0, 0, -this.mazeSize/2, this.mazeSize, wallMaterial);
        // South wall
        this.createWall(0, 0, this.mazeSize/2, this.mazeSize, wallMaterial);
        // East wall
        this.createWall(this.mazeSize/2, 0, 0, this.mazeSize, wallMaterial, true);
        // West wall
        this.createWall(-this.mazeSize/2, 0, 0, this.mazeSize, wallMaterial, true);

        // Inner maze walls to create the path
        this.createInnerMazeWalls(wallMaterial);

        // Center disk (goal)
        const diskGeometry = new THREE.CylinderGeometry(15, 15, 2, 32);
        const diskMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.8,
            roughness: 0.2
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.position.y = -this.wallHeight / 2 + 1;
        disk.receiveShadow = true;
        this.mazeGroup.add(disk);

        this.scene.add(this.mazeGroup);
    }

    createWall(x, y, z, length, material, rotateY = false) {
        const wallGeometry = new THREE.BoxGeometry(
            rotateY ? this.wallThickness : length,
            this.wallHeight,
            rotateY ? length : this.wallThickness
        );
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.mazeGroup.add(wall);
        return wall;
    }

    createInnerMazeWalls(material) {
        // Create inner walls to form the labyrinth path
        const walls = [
            // Horizontal walls
            { x: -55, z: -55, length: 60, rotateY: false },
            { x: -25, z: -25, length: 40, rotateY: false },
            { x: 20, z: 5, length: 50, rotateY: false },
            { x: 45, z: 30, length: 40, rotateY: false },

            // Vertical walls
            { x: -25, z: -55, length: 40, rotateY: true },
            { x: 0, z: -25, length: 40, rotateY: true },
            { x: 25, z: 10, length: 45, rotateY: true },
            { x: 45, z: 45, length: 30, rotateY: true }
        ];

        walls.forEach(w => {
            this.createWall(w.x, 0, w.z, w.length, material, w.rotateY);
        });
    }

    createSphere() {
        // Create reflective metal sphere (18mm diameter)
        const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.95,
            roughness: 0.05,
            envMapIntensity: 1.5
        });

        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.sphere.position.copy(this.tiltPaths[0][0]);
        this.sphere.position.y = this.sphereRadius - this.wallHeight / 2 + 1;
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;

        this.scene.add(this.sphere);

        // Add environment map for reflections
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });

        const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
        this.scene.add(cubeCamera);
        sphereMaterial.envMap = cubeRenderTarget.texture;
    }

    setupUI() {
        document.getElementById('tiltUp').addEventListener('click', () => this.handleTilt('up'));
        document.getElementById('tiltDown').addEventListener('click', () => this.handleTilt('down'));
        document.getElementById('tiltLeft').addEventListener('click', () => this.handleTilt('left'));
        document.getElementById('tiltRight').addEventListener('click', () => this.handleTilt('right'));
        document.getElementById('reset').addEventListener('click', () => this.reset());
    }

    handleTilt(direction) {
        if (this.isAnimating || this.tiltCount >= 4) return;

        this.isAnimating = true;
        this.tiltCount++;

        // Update UI
        document.getElementById('tiltCount').textContent = this.tiltCount;
        document.getElementById('message').textContent = `Tilt ${this.tiltCount} of 4 - Moving sphere...`;

        // Disable buttons during animation
        this.setButtonsEnabled(false);

        // Get current path
        this.currentPath = this.tiltPaths[this.tiltCount - 1];
        this.pathIndex = 0;

        // Calculate speed (increases with each tilt)
        const baseSpeed = 0.5;
        const speedMultiplier = 1 + (this.tiltCount - 1) * 0.3;
        const speed = baseSpeed * speedMultiplier;

        if (this.tiltCount === 4) {
            // Special 4th tilt sequence
            this.animateToCenter(speed, () => {
                this.triggerFourthTiltFeedback();
            });
        } else {
            // Normal tilt animation
            this.animateAlongPath(speed, () => {
                this.isAnimating = false;
                this.setButtonsEnabled(true);
                document.getElementById('message').textContent = `Tilt ${this.tiltCount} complete! ${4 - this.tiltCount} more to go.`;
            });
        }
    }

    animateAlongPath(speed, callback) {
        if (this.pathIndex >= this.currentPath.length) {
            callback();
            return;
        }

        const targetPos = this.currentPath[this.pathIndex].clone();
        targetPos.y = this.sphereRadius - this.wallHeight / 2 + 1;

        const distance = this.sphere.position.distanceTo(targetPos);
        const duration = (distance / speed) * 16; // Convert to frames

        this.animateSphereToPosition(targetPos, duration, () => {
            this.pathIndex++;
            this.animateAlongPath(speed, callback);
        });
    }

    animateToCenter(speed, callback) {
        this.animateAlongPath(speed, callback);
    }

    animateSphereToPosition(targetPos, duration, callback) {
        const startPos = this.sphere.position.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = this.easeInOutQuad(progress);

            this.sphere.position.lerpVectors(startPos, targetPos, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    triggerFourthTiltFeedback() {
        document.getElementById('message').textContent = 'Success! Triggering special sequence...';

        const initialMazeY = this.mazeGroup.position.y;
        const initialSpherePos = this.sphere.position.clone();

        // Step 1: Drop maze 8% down with 0.2s buffer easing
        this.animateMazeDrop(initialMazeY, () => {
            // Step 2: Launch sphere upward 12%
            this.animateSphereLaunch(initialSpherePos, () => {
                // Step 3: Orbit 2 loops around maze exterior at 12% radius
                this.animateSphereOrbit(() => {
                    // Step 4: Settle back to center
                    this.animateSphereSettle(() => {
                        // Final state
                        this.isAnimating = false;
                        document.getElementById('message').textContent = 'Journey complete! The sphere has found its home.';

                        // Keep orbit controls active
                        this.controls.enabled = true;
                    });
                });
            });
        });
    }

    animateMazeDrop(initialY, callback) {
        const dropDistance = this.mazeSize * 0.08; // 8% down
        const targetY = initialY - dropDistance;
        const duration = 200; // 0.2s
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);

            this.mazeGroup.position.y = initialY + (targetY - initialY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    animateSphereLaunch(initialPos, callback) {
        const launchHeight = this.mazeSize * 0.12; // 12% up
        const targetY = initialPos.y + launchHeight;
        const duration = 400;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            this.sphere.position.y = initialPos.y + (targetY - initialPos.y) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    animateSphereOrbit(callback) {
        const orbitRadius = this.mazeSize * 0.12; // 12% radius
        const loops = 2;
        const duration = 2000; // 2 seconds for 2 loops
        const startTime = Date.now();
        const centerY = this.sphere.position.y;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Calculate orbit position
            const angle = progress * loops * Math.PI * 2;
            this.sphere.position.x = Math.cos(angle) * orbitRadius;
            this.sphere.position.z = Math.sin(angle) * orbitRadius;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    animateSphereSettle(callback) {
        const targetPos = new THREE.Vector3(0, this.sphereRadius - this.wallHeight / 2 + 1, 0);
        const duration = 800;
        const startTime = Date.now();
        const startPos = this.sphere.position.clone();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuad(progress);

            this.sphere.position.lerpVectors(startPos, targetPos, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };

        animate();
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    setButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.tilt-btn');
        buttons.forEach(btn => btn.disabled = !enabled);
    }

    reset() {
        // Reset all state
        this.tiltCount = 0;
        this.isAnimating = false;
        this.pathIndex = 0;

        // Reset sphere position
        this.sphere.position.copy(this.tiltPaths[0][0]);
        this.sphere.position.y = this.sphereRadius - this.wallHeight / 2 + 1;

        // Reset maze position
        this.mazeGroup.position.y = 0;

        // Reset UI
        document.getElementById('tiltCount').textContent = '0';
        document.getElementById('message').textContent = 'Start tilting to move the sphere!';
        this.setButtonsEnabled(true);
    }

    onWindowResize() {
        const width = Math.min(window.innerWidth - 400, 800);
        const height = Math.min(window.innerHeight - 100, 600);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new TiltLabyrinth();
});
