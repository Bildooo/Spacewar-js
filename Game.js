/**
 * Game.js
 * Main game logic and loop
 */

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 800;

        // Game state
        this.state = 'menu'; // 'menu', 'playing', 'gameOver'
        this.gameMode = null; // 'pvp' or 'ai'
        this.aiDifficulty = 'easy'; // 'easy', 'medium', 'hard'

        // Game Options
        this.hazardsEnabled = false;
        this.fuelEnabled = false;

        // Game loop state
        this.running = false;
        this.lastFrameTime = 0;

        // Constellations data (relative coordinates 0-1)
        this.constellations = [
            // Ursa Major (Big Dipper)
            {
                name: 'Ursa Major',
                stars: [
                    { x: 0.1, y: 0.2 }, { x: 0.15, y: 0.22 }, { x: 0.2, y: 0.25 }, // Handle
                    { x: 0.25, y: 0.3 }, { x: 0.3, y: 0.28 }, { x: 0.32, y: 0.35 }, { x: 0.25, y: 0.38 } // Bowl
                ],
                lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
            },
            // Ursa Minor (Little Dipper)
            {
                name: 'Ursa Minor',
                stars: [
                    { x: 0.6, y: 0.15 }, { x: 0.65, y: 0.18 }, { x: 0.7, y: 0.2 }, // Handle
                    { x: 0.75, y: 0.22 }, { x: 0.78, y: 0.2 }, { x: 0.8, y: 0.25 }, { x: 0.75, y: 0.27 } // Bowl
                ],
                lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
            },
            // Cassiopeia
            {
                name: 'Cassiopeia',
                stars: [
                    { x: 0.8, y: 0.6 }, { x: 0.85, y: 0.65 }, { x: 0.9, y: 0.62 },
                    { x: 0.95, y: 0.68 }, { x: 0.98, y: 0.65 }
                ],
                lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
            }
        ];

        // Circular play area (like original Spacewar!)
        this.playAreaRadius = this.canvas.height / 2 - 10; // Full height minus small margin
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;

        // Game objects
        this.sun = new Sun(
            this.canvas.width / 2,
            this.canvas.height / 2,
            1000, // mass
            30    // radius
        );

        // Ship 1 (Blue) - starts on right side
        this.ship1 = new Ship(
            this.canvas.width / 2 + 250,  // Right of center
            this.canvas.height / 2,
            Math.PI,  // Facing left
            1,  // id
            '#00BFFF' // blue
        );

        // Ship 2 (Pink) - starts on left side
        this.ship2 = new Ship(
            this.canvas.width / 2 - 250,  // Left of center
            this.canvas.height / 2,
            0,  // Facing right
            2,  // id
            '#FF1493' // pink
        );

        this.bullets = [];
        this.asteroids = [];
        this.fuelCanisters = []; // Array for fuel items
        this.asteroidSpawnTimer = 0;
        this.debris = []; // For asteroid fragments

        // Input system
        this.input = new Input();

        // Sound manager
        this.soundManager = new SoundManager();
        this.soundManager.loadSound('laser', 'sounds/laserShoot.wav');
        this.soundManager.loadSound('explosion', 'sounds/explosion_2.wav');
        this.soundManager.loadSound('hyperspace', 'sounds/soundhyper.wav');
        this.soundManager.loadMusic('sounds/musicSpacewar.mp3');

        // AI controller (will be initialized when AI mode is selected)
        this.ai = null;

        // Physics constants
        this.G = 0.5; // Gravitational constant

        // Game loop state
        this.running = false;
        this.lastFrameTime = 0;

        // Infalling background stars
        this.infallingStars = [];
        this.initInfallingStars();
    }

    /**
     * Initialize infalling stars
     */
    initInfallingStars() {
        for (let i = 0; i < 20; i++) {
            this.spawnInfallingStar(true);
        }
    }

    /**
     * Spawn a single infalling star
     * @param {boolean} randomPos If true, spawn anywhere in play area (for init). If false, spawn at edge.
     */
    spawnInfallingStar(randomPos = false) {
        let x, y;
        if (randomPos) {
            // Random position within play area, but not too close to sun
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * (this.playAreaRadius - 100);
            x = this.centerX + Math.cos(angle) * dist;
            y = this.centerY + Math.sin(angle) * dist;
        } else {
            // Spawn at edge
            const angle = Math.random() * Math.PI * 2;
            const dist = this.playAreaRadius - 10;
            x = this.centerX + Math.cos(angle) * dist;
            y = this.centerY + Math.sin(angle) * dist;
        }

        this.infallingStars.push({
            position: new Vector2(x, y),
            velocity: new Vector2(0, 0), // Starts with zero velocity, gravity will pull it
            mass: 10, // Small mass so gravity affects it, but maybe needs tuning relative to G
            // Actually G forces are independent of mass of object (a = F/m = (GMm/r^2)/m = GM/r^2)
            // So mass doesn't matter for acceleration calculation if we use our physics correctly.
            // But we need to use calculate acceleration directly or give it mass=1.
            size: 1 + Math.random() * 2,
            color: `rgba(255, 255, ${200 + Math.random() * 55}, ${0.5 + Math.random() * 0.5})`
        });
    }

    /**
     * Start the game loop
     */
    start() {
        this.running = true;

        // precise-music-start: Attempt to play music immediately
        this.soundManager.playMusic();

        // Add one-time interaction listener to start music if autoplay blocked it
        const startMusicOnInteraction = () => {
            if (this.soundManager.isMusicEnabled() && this.soundManager.isMusicPaused()) {
                this.soundManager.playMusic();
            }
            // Remove listeners once triggers
            window.removeEventListener('keydown', startMusicOnInteraction);
            window.removeEventListener('click', startMusicOnInteraction);
        };

        window.addEventListener('keydown', startMusicOnInteraction);
        window.addEventListener('click', startMusicOnInteraction);

        this.gameLoop();
    }

    /**
     * Main game loop
     */
    gameLoop(timestamp = 0) {
        if (!this.running) return;

        // Calculate delta time (not used for fixed timestep, but available)
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Update and render based on game state
        if (this.state === 'menu') {
            // Ensure music is playing in menu (if enabled)
            // We can try playing strictly once, or just let the manager handle it (it checks state)
            // But avoiding spamming play() every frame is better.
            // Ideally we handle this on transition, but for now let's just leave it to manual triggers or transition.
            // Actually, browser policy requires interaction.
            // Let's rely on the startGame/endGame transitions for logic, 
            // but we need to start it initially.
            // We'll add a one-time check or just start it on first input?
            // Simpler: Just render and handle input. Input will trigger musicstart if needed or we start it on "Space" from game over.
            // For initial load, we might need a "Press any key" or just let it start on first click.
            // Let's add a `playMusic()` call in `renderMenu`'s first pass? No.
            // Let's just put it in `handleMenuInput` or when returning from game over.
            // For the *very first* load, we can try to play in `start()`.
            this.renderMenu();
            this.handleMenuInput();
        } else if (this.state === 'playing') {
            this.update();
            this.render();
        } else if (this.state === 'gameOver') {
            this.render();
            this.handleGameOverInput();
        }

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * Update game state
     */
    update() {
        // Get input for both ships
        const input1 = this.input.getShip1Input();
        const input2 = this.gameMode === 'ai' ? this.ai.update() : this.input.getShip2Input();

        // Handle Ship 1 input
        if (input1.rotateLeft) this.ship1.rotate(-1);
        if (input1.rotateRight) this.ship1.rotate(1);
        if (input1.thrust) this.ship1.thrust();
        if (input1.thrust) this.ship1.thrust();
        if (input1.hyperspace) this.ship1.hyperspace(this.soundManager);
        this.ship1.setShield(input1.shield); // Toggle shield

        if (input1.shoot) {
            const bullet = this.ship1.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                this.soundManager.play('laser');
            }
        }

        // Handle Ship 2 input
        if (input2.rotateLeft) this.ship2.rotate(-1);
        if (input2.rotateRight) this.ship2.rotate(1);
        if (input2.thrust) this.ship2.thrust();
        if (input2.thrust) this.ship2.thrust();
        if (input2.hyperspace) this.ship2.hyperspace(this.soundManager);
        this.ship2.setShield(input2.shield); // Toggle shield

        if (input2.shoot) {
            const bullet = this.ship2.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                this.soundManager.play('laser');
            }
        }

        // Apply gravity to ships
        const gravityForce1 = this.sun.getGravitationalForce(
            this.ship1.position,
            this.ship1.mass,
            this.G
        );
        this.ship1.applyForce(gravityForce1);

        const gravityForce2 = this.sun.getGravitationalForce(
            this.ship2.position,
            this.ship2.mass,
            this.G
        );
        this.ship2.applyForce(gravityForce2);

        // Apply gravity to bullets and update them
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            if (!bullet.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Apply gravity
            const bulletGravity = this.sun.getGravitationalForce(
                bullet.position,
                bullet.mass,
                this.G
            );
            bullet.applyForce(bulletGravity);

            // Update bullet
            bullet.update(this.canvas.width, this.canvas.height);

            // Check collision with sun
            if (this.sun.isColliding(bullet.position, bullet.radius)) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Check collision with ships
            // Collision with Ship 1
            if (bullet.ownerId !== this.ship1.id) {
                const hit1 = bullet.checkCollision(this.ship1.position, this.ship1.radius + (this.ship1.shieldActive ? 8 : 0));
                if (hit1) {
                    if (this.ship1.shieldActive) {
                        // Shield blocks bullet
                        this.bullets.splice(i, 1);
                        this.soundManager.play('shield'); // Need shield hit sound? reusing or default
                        continue;
                    } else {
                        // Ship dies
                        this.ship1.die(this.soundManager);
                        this.ship2.resetToStart(); // Reset P2
                        this.bullets = []; // Clear all bullets
                        break;
                    }
                }
            }

            // Collision with Ship 2
            if (bullet.ownerId !== this.ship2.id) {
                const hit2 = bullet.checkCollision(this.ship2.position, this.ship2.radius + (this.ship2.shieldActive ? 8 : 0));
                if (hit2) {
                    if (this.ship2.shieldActive) {
                        // Shield blocks bullet
                        this.bullets.splice(i, 1);
                        this.soundManager.play('shield');
                        continue;
                    } else {
                        // Ship dies
                        this.ship2.die(this.soundManager);
                        this.ship1.resetToStart(); // Reset P1
                        this.bullets = []; // Clear all bullets
                        break;
                    }
                }
            }
        }

        // Update ships
        this.ship1.update(this.canvas.width, this.canvas.height);
        this.ship2.update(this.canvas.width, this.canvas.height);

        // Check ship collision with sun
        if (this.sun.isColliding(this.ship1.position, this.ship1.radius)) {
            this.ship1.die(this.soundManager);
            this.ship2.resetToStart(); // Reset P2
            this.bullets = []; // Clear bullets
        }
        if (this.sun.isColliding(this.ship2.position, this.ship2.radius)) {
            this.ship2.die(this.soundManager);
            this.ship1.resetToStart(); // Reset P1
            this.bullets = []; // Clear bullets
        }

        // Check ship-to-ship collision
        if (this.ship1.active && this.ship2.active) {
            const distance = this.ship1.position.distanceTo(this.ship2.position);
            if (distance < this.ship1.radius + this.ship2.radius) {
                // Both ships explode!
                this.ship1.die(this.soundManager);
                this.ship2.die(this.soundManager);
                this.bullets = []; // Clear bullets
            }
        }

        // Update debris
        this.updateDebris();

        // Update asteroids
        if (this.hazardsEnabled) {
            this.updateAsteroids();
        }

        // Update infalling stars
        this.updateInfallingStars();

        // Update fuel canisters
        if (this.fuelEnabled) {
            this.updateFuelCanisters();
        }
    }

    /**
     * Update and manage Fuel Canisters
     */
    updateFuelCanisters() {
        // Spawn chance (rare)
        if (this.fuelCanisters.length < 2 && Math.random() < 0.002) { // approx once every 8-10 seconds
            this.spawnFuelCanister();
        }

        for (let i = this.fuelCanisters.length - 1; i >= 0; i--) {
            const canister = this.fuelCanisters[i];
            canister.update(this.canvas.width, this.canvas.height);

            // Check collision with ships
            if (this.ship1.active) {
                const dist = canister.position.distanceTo(this.ship1.position);
                if (dist < canister.radius + this.ship1.radius) {
                    // Pickup
                    this.ship1.addFuel(canister.fuelAmount);
                    this.fuelCanisters.splice(i, 1);
                    this.soundManager.play('shield'); // Reuse distinct sound
                    continue;
                }
            }

            if (this.ship2.active) {
                const dist = canister.position.distanceTo(this.ship2.position);
                if (dist < canister.radius + this.ship2.radius) {
                    // Pickup
                    this.ship2.addFuel(canister.fuelAmount);
                    this.fuelCanisters.splice(i, 1);
                    this.soundManager.play('shield');
                    continue;
                }
            }
        }
    }

    /**
     * Spawn a fuel canister
     */
    spawnFuelCanister() {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        this.fuelCanisters.push(new FuelCanister(x, y));
    }

    /**
     * Update and manage asteroids
     */
    updateAsteroids() {
        // Spawn/Respawn asteroids
        if (this.asteroids.length < 3) { // Keep around 3 asteroids
            this.asteroidSpawnTimer++;
            if (this.asteroidSpawnTimer > 300) { // Every 5 seconds if low
                this.spawnAsteroid();
                this.asteroidSpawnTimer = 0;
            }
        }

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.update(this.canvas.width, this.canvas.height);

            // Collision with sun
            if (this.sun.isColliding(asteroid.position, asteroid.radius)) {
                this.asteroids.splice(i, 1);
                continue;
            }

            // Collision with ships
            if (this.ship1.active && !this.ship1.shieldActive && // Shield protects!
                asteroid.position.distanceTo(this.ship1.position) < asteroid.radius + this.ship1.radius) {
                this.ship1.die(this.soundManager);
                this.ship2.resetToStart();
                this.bullets = []; // Clear bullets
            }
            if (this.ship2.active && !this.ship2.shieldActive &&
                asteroid.position.distanceTo(this.ship2.position) < asteroid.radius + this.ship2.radius) {
                this.ship2.die(this.soundManager);
                this.ship1.resetToStart();
                this.bullets = []; // Clear bullets
            }

            // Collision with bullets (Bullet destroys asteroid)
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                if (asteroid.position.distanceTo(bullet.position) < asteroid.radius + bullet.radius) {
                    // Create debris
                    const particles = asteroid.break();
                    this.debris.push(...particles);

                    // Destroy asteroid
                    this.asteroids.splice(i, 1);
                    // Destroy bullet
                    this.bullets.splice(j, 1);
                    this.soundManager.play('explosion');
                    // Break loop since asteroid is gone
                    break;
                }
            }
        }
    }

    /**
     * Update space debris
     */
    updateDebris() {
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const p = this.debris[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.debris.splice(i, 1);
            }
        }
    }

    /**
     * Update infalling stars logic
     */
    updateInfallingStars() {
        for (let i = this.infallingStars.length - 1; i >= 0; i--) {
            const star = this.infallingStars[i];

            // Apply gravity
            // We can reuse sun.getGravitationalForce, but that returns Force. a = F/m.
            // Let's assume mass 1 for simplicity.
            const gravityForce = this.sun.getGravitationalForce(
                star.position,
                1, // mass 1
                this.G
            );

            // Apply acceleration to velocity
            star.velocity.add(gravityForce); // F=ma => a=F (if m=1)

            // Update position
            star.position.add(star.velocity);

            // Check collision/swallowed by sun
            if (this.sun.isColliding(star.position, star.size)) {
                // Remove and respawn
                this.infallingStars.splice(i, 1);
                this.spawnInfallingStar(false); // Respawn at edge
            }
        }
    }

    /**
     * Render infalling stars
     */
    renderInfallingStars() {
        this.ctx.save();
        for (const star of this.infallingStars) {
            this.ctx.fillStyle = star.color;
            this.ctx.shadowBlur = star.size * 2;
            this.ctx.shadowColor = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    /**
     * Spawn a new random asteroid
     */
    spawnAsteroid() {
        const angle = Math.random() * Math.PI * 2;
        const dist = this.playAreaRadius * 0.9;
        const x = this.centerX + Math.cos(angle) * dist;
        const y = this.centerY + Math.sin(angle) * dist;

        // Aim somewhat towards center but randomly
        const targetX = this.centerX + (Math.random() - 0.5) * 400;
        const targetY = this.centerY + (Math.random() - 0.5) * 400;

        const velocity = new Vector2(targetX - x, targetY - y);
        velocity.normalize().multiply(1 + Math.random()); // Random speed
        this.asteroids.push(new Asteroid(x, y, 10 + Math.random() * 15, velocity));
    }

    /**
     * Render game objects
     */
    render() {
        // Clear canvas with space background
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars (simple background)
        this.drawStars();

        // Draw constellations
        this.drawConstellations();

        // Draw circular play area with black mask outside
        this.ctx.save();

        // Fill entire canvas with black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Create circular clip region for play area
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.playAreaRadius, 0, Math.PI * 2);
        this.ctx.clip();

        // Fill play area with deep space gradient
        const bgGradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.playAreaRadius
        );
        bgGradient.addColorStop(0, '#0a0a2a'); // Deep blue/purple center
        bgGradient.addColorStop(0.6, '#050515');
        bgGradient.addColorStop(1, '#000005'); // Almost black edges

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw infalling stars inside the play area
        this.renderInfallingStars();

        this.ctx.restore();

        // Draw circular border
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(100, 150, 200, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.playAreaRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();

        // Draw sun
        this.sun.render(this.ctx);

        // Draw asteroids
        if (this.hazardsEnabled) {
            for (const asteroid of this.asteroids) {
                asteroid.render(this.ctx);
            }
        }

        // Draw debris
        this.renderDebris();

        // Draw fuel canisters
        if (this.fuelEnabled) {
            for (const canister of this.fuelCanisters) {
                canister.render(this.ctx);
            }
        }

        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }

        // Draw ships with thrust indicator
        const input1 = this.input.getShip1Input();
        const input2 = this.input.getShip2Input();

        let ship2Thrust = input2.thrust;
        if (this.gameMode === 'ai' && this.ai) {
            ship2Thrust = this.ai.shouldThrust;
        }

        this.ship1.render(this.ctx, input1.thrust);
        this.ship2.render(this.ctx, ship2Thrust);

        // Draw UI
        this.renderUI();
    }

    /**
     * Draw enhanced star background with twinkling
     */
    drawStars() {
        // Initialize stars if not done yet
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 200; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: Math.random() * 2 + 0.5,
                    brightness: Math.random(),
                    twinkleSpeed: Math.random() * 0.05 + 0.01,
                    twinkleOffset: Math.random() * Math.PI * 2
                });
            }
            this.starTime = 0;
        }

        this.starTime += 0.05;

        this.ctx.save();
        for (const star of this.stars) {
            // Calculate twinkling brightness
            const twinkle = Math.sin(this.starTime * star.twinkleSpeed + star.twinkleOffset);
            const brightness = star.brightness * (0.5 + twinkle * 0.5);

            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.shadowBlur = star.size * 2;
            this.ctx.shadowColor = '#FFFFFF';

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    /**
     * Draw constellations
     */
    drawConstellations() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

        for (const constellation of this.constellations) {
            // Draw lines
            this.ctx.beginPath();
            for (const line of constellation.lines) {
                const start = constellation.stars[line[0]];
                const end = constellation.stars[line[1]];

                this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
                this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
            }
            this.ctx.stroke();

            // Draw stars
            for (const star of constellation.stars) {
                const x = star.x * this.canvas.width;
                const y = star.y * this.canvas.height;

                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }

    /**
     * Render space debris
     */
    renderDebris() {
        this.ctx.save();
        for (const p of this.debris) {
            this.ctx.fillStyle = `rgba(170, 170, 170, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    /**
     * Render UI elements
     */
    renderUI() {
        // Ship status - Swapped positions:
        // Ship 1 (Blue/Arrows) starts Right, so UI is on Right
        // Ship 2 (Pink/WASD) starts Left, so UI is on Left

        // Ship 2 (Pink) - Left side UI
        this.ship2.renderUI(this.ctx, 20, 30);

        // Ship 1 (Blue) - Right side UI
        this.ship1.renderUI(this.ctx, this.canvas.width - 180, 30);

        // Controls help (only in PvP mode)
        if (this.gameMode === 'pvp') {
            this.ctx.save();
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('P1: \u2191=Thrust \u2190/\u2192=Rotate RCtrl=Shoot | \u2193=Hyperspace RShift=Shield', 20, this.canvas.height - 20);
            this.ctx.fillText('P2: W=Thrust A/D=Rotate V=Shoot | S=Hyperspace B=Shield', 20, this.canvas.height - 5);
            this.ctx.restore();
        } else if (this.gameMode === 'ai') {
            this.ctx.save();
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('Player: \u2191=Thrust \u2190/\u2192=Rotate RCtrl=Shoot | \u2193=Hyperspace RShift=Shield', 20, this.canvas.height - 20);
            this.ctx.restore();
        }

        // Check for game over
        if (this.ship1.lives <= 0 || this.ship2.lives <= 0) {
            if (this.state === 'playing') {
                this.state = 'gameOver';
            }
            this.renderGameOver();
        }
    }

    /**
     * Render game over screen
     */
    renderGameOver() {
        this.ctx.save();

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Winner text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';

        let winner = '';
        if (this.ship1.lives <= 0 && this.ship2.lives <= 0) {
            winner = 'DRAW!';
        } else if (this.ship1.lives <= 0) {
            winner = 'PLAYER 2 WINS!';
        } else {
            winner = 'PLAYER 1 WINS!';
        }

        this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2);

        // Display final score (remaining lives)
        this.ctx.font = '32px monospace';
        this.ctx.fillStyle = '#CCCCCC';
        const score = `${this.ship1.lives}:${this.ship2.lives}`;
        this.ctx.fillText(`Score: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);

        this.ctx.font = '32px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 90);

        this.ctx.restore();
    }

    /**
     * Render main menu
     */
    renderMenu() {
        // Clear canvas
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.drawStars();

        // Title
        this.ctx.save();
        this.ctx.textAlign = 'center'; // Set text alignment for all menu text

        // Game title
        this.ctx.font = 'bold 72px monospace';
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, '#00BFFF');
        gradient.addColorStop(1, '#FF1493');
        this.ctx.fillStyle = gradient;
        this.ctx.fillText('SPACEWAR!', this.canvas.width / 2, 80);

        // Menu options
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.fillText('Press 1: Player vs Computer', this.canvas.width / 2, 160);

        this.ctx.fillStyle = '#FF1493';
        this.ctx.fillText('Press 2: Player vs Player', this.canvas.width / 2, 200);

        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(`Press 3: Difficulty ${this.aiDifficulty.toUpperCase()}`, this.canvas.width / 2, 240);

        this.ctx.fillStyle = this.hazardsEnabled ? '#FF4500' : '#555555';
        this.ctx.fillText(`Press 4: Hazards [${this.hazardsEnabled ? 'ON' : 'OFF'}]`, this.canvas.width / 2, 280);

        this.ctx.fillStyle = this.fuelEnabled ? '#FFD700' : '#555555';
        this.ctx.fillText(`Press 5: Fuel [${this.fuelEnabled ? 'ON' : 'OFF'}]`, this.canvas.width / 2, 320);

        // Game objective
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('OBJECTIVE:', this.canvas.width / 2, 380);
        this.ctx.font = '22px monospace';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Defeat your opponent within the sun\'s gravity well!', this.canvas.width / 2, 410);

        // Controls
        this.ctx.font = 'bold 22px monospace';
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.fillText('PLAYER 1 CONTROLS:', this.canvas.width / 2, 450);
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.fillText('Move: \u2191\u2190\u2192 | Shoot: R-Ctrl | Hyper: \u2193 | Shield: R-Shift', this.canvas.width / 2, 475);

        this.ctx.font = 'bold 22px; monospace';
        this.ctx.fillStyle = '#FF1493';
        this.ctx.fillText('PLAYER 2 CONTROLS:', this.canvas.width / 2, 515);
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#FF88CC';
        this.ctx.fillText('Move: WAD | Shoot: V | Hyper: S | Shield: B', this.canvas.width / 2, 540);

        // Sound toggle
        this.ctx.font = '20px monospace';

        // Sound Effects (S)
        this.ctx.fillStyle = this.soundManager.isSoundEnabled() ? '#757575ff' : '#FF0000';
        const soundStatus = this.soundManager.isSoundEnabled() ? 'ON' : 'OFF';
        this.ctx.fillText(`Press S: SFX ${soundStatus}`, this.canvas.width / 2 - 120, 630);

        // Music (M)
        this.ctx.fillStyle = this.soundManager.isMusicEnabled() ? '#757575ff' : '#FF0000';
        const musicStatus = this.soundManager.isMusicEnabled() ? 'ON' : 'OFF';
        this.ctx.fillText(`Press M: Music ${musicStatus}`, this.canvas.width / 2 + 120, 630);

        // Author credits
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = 'rgba(221, 221, 221, 1)';
        this.ctx.fillText('Developed by Robert Bielka (Bildo) in collaboration with AI — January 31, 2026', this.canvas.width / 2, this.canvas.height - 80);

        // Historical information
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = 'rgba(221, 221, 221, 1)';
        const historyLine1 = 'Spacewar! is considered one of the earliest and most influential video games in history,';
        const historyLine2 = 'developed in 1962 by Steve Russell and a team of MIT students for the DEC PDP-1 minicomputer.';
        this.ctx.fillText(historyLine1, this.canvas.width / 2, this.canvas.height - 50);
        this.ctx.fillText(historyLine2, this.canvas.width / 2, this.canvas.height - 35);

        // version
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = 'rgba(158, 158, 158, 1)';
        const vers = 'version 0.8.0';
        this.ctx.fillText(vers, this.canvas.width - 70, this.canvas.height - 5);


        this.ctx.restore();
    }

    /**
     * Handle menu input
     */
    handleMenuInput() {
        if (this.input.isKeyPressed('1') || this.input.isKeyPressed('Digit1')) {
            this.startGame('ai');
        } else if (this.input.isKeyPressed('2') || this.input.isKeyPressed('Digit2')) {
            this.startGame('pvp');
        } else if (this.input.isKeyPressed('3') || this.input.isKeyPressed('Digit3')) {
            this.cycleDifficulty();
        } else if (this.input.isKeyPressed('4') || this.input.isKeyPressed('Digit4')) {
            this.hazardsEnabled = !this.hazardsEnabled;
        } else if (this.input.isKeyPressed('5') || this.input.isKeyPressed('Digit5')) {
            this.fuelEnabled = !this.fuelEnabled;
        } else if (this.input.isKeyPressed('s') || this.input.isKeyPressed('S')) {
            // S for Sound Effects
            this.soundManager.toggleSound();
        } else if (this.input.isKeyPressed('m') || this.input.isKeyPressed('M')) {
            // M for Music
            this.soundManager.toggleMusic();
        }
    }

    /**
     * Start the game with selected mode
     */
    startGame(mode) {
        this.gameMode = mode;
        this.state = 'playing';

        // Ensure music continues playing (don't stop it!)
        this.soundManager.playMusic();

        // Reset ships
        this.ship1.lives = 5;
        this.ship1.position.copy(this.ship1.startPosition);
        this.ship1.velocity.set(0, 0);
        this.ship1.angle = this.ship1.startAngle;
        this.ship1.active = true;
        this.ship1.respawnTimer = 0;
        this.ship1.fuelEnabled = this.fuelEnabled;

        this.ship2.lives = 5;
        this.ship2.position.copy(this.ship2.startPosition);
        this.ship2.velocity.set(0, 0);
        this.ship2.angle = this.ship2.startAngle;
        this.ship2.active = true;
        this.ship2.respawnTimer = 0;
        this.ship2.fuelEnabled = this.fuelEnabled;

        // Clear
        this.bullets = [];
        this.asteroids = [];
        this.fuelCanisters = [];
        this.debris = [];
        this.asteroidSpawnTimer = 0;

        // Initialize AI if needed
        if (mode === 'ai') {
            this.ai = new AI(this.ship2, this.ship1, this.sun);
            this.ai.setDifficulty(this.aiDifficulty);
        } else {
            this.ai = null;
        }
    }

    /**
     * Cycle through difficulty levels
     */
    cycleDifficulty() {
        // Debounce input slightly to prevent cycling too fast
        const now = Date.now();
        if (this.lastDifficultyChange && now - this.lastDifficultyChange < 200) return;
        this.lastDifficultyChange = now;

        if (this.aiDifficulty === 'easy') {
            this.aiDifficulty = 'medium';
        } else if (this.aiDifficulty === 'medium') {
            this.aiDifficulty = 'hard';
        } else {
            this.aiDifficulty = 'easy';
        }
    }

    /**
     * Handle game over input
     */
    handleGameOverInput() {
        if (this.input.isKeyPressed(' ') || this.input.isKeyPressed('Space')) {
            this.state = 'menu';
            this.gameMode = null;
            // Ensure music continues or restarts
            this.soundManager.playMusic();
        }
    }
}
