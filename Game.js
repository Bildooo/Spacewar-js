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

        // Game loop state
        this.running = false;
        this.lastFrameTime = 0;

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

        // Ship 1 (Blue) - starts on left side
        this.ship1 = new Ship(
            this.canvas.width / 2 - 250,  // Left of center
            this.canvas.height / 2,
            0,  // Facing right
            1,  // id
            '#00BFFF' // color
        );

        // Ship 2 (Pink) - starts on right side
        this.ship2 = new Ship(
            this.canvas.width / 2 + 250,  // Right of center
            this.canvas.height / 2,
            Math.PI,  // Facing left
            2,  // id
            '#FF1493' // color
        );

        this.bullets = [];

        // Input system
        this.input = new Input();

        // Sound manager
        this.soundManager = new SoundManager();
        this.soundManager.loadSound('laser', 'sounds/laserShoot.wav');
        this.soundManager.loadSound('explosion', 'sounds/explosion_2.wav');

        // AI controller (will be initialized when AI mode is selected)
        this.ai = null;

        // Physics constants
        this.G = 0.5; // Gravitational constant

        // Game loop state
        this.running = false;
        this.lastFrameTime = 0;
    }

    /**
     * Start the game loop
     */
    start() {
        this.running = true;
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

            // Check collision with ships (can't hit own ship)
            if (bullet.ownerId !== this.ship1.id &&
                bullet.checkCollision(this.ship1.position, this.ship1.radius)) {
                this.ship1.die(this.soundManager);
                this.bullets.splice(i, 1);
                continue;
            }

            if (bullet.ownerId !== this.ship2.id &&
                bullet.checkCollision(this.ship2.position, this.ship2.radius)) {
                this.ship2.die(this.soundManager);
                this.bullets.splice(i, 1);
                continue;
            }
        }

        // Update ships
        this.ship1.update(this.canvas.width, this.canvas.height);
        this.ship2.update(this.canvas.width, this.canvas.height);

        // Check ship collision with sun
        if (this.sun.isColliding(this.ship1.position, this.ship1.radius)) {
            this.ship1.die(this.soundManager);
        }
        if (this.sun.isColliding(this.ship2.position, this.ship2.radius)) {
            this.ship2.die(this.soundManager);
        }

        // Check ship-to-ship collision
        if (this.ship1.active && this.ship2.active) {
            const distance = this.ship1.position.distanceTo(this.ship2.position);
            if (distance < this.ship1.radius + this.ship2.radius) {
                // Both ships explode!
                this.ship1.die(this.soundManager);
                this.ship2.die(this.soundManager);
            }
        }

        // Update sun gravity particles animation
        this.sun.updateGravityParticles();
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

        // Draw circular play area with black mask outside
        this.ctx.save();

        // Fill entire canvas with black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Create circular clip region for play area
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.playAreaRadius, 0, Math.PI * 2);
        this.ctx.clip();

        // Fill play area with game background
        this.ctx.fillStyle = '#000814';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }

        // Draw ships with thrust indicator
        const input1 = this.input.getShip1Input();
        const input2 = this.input.getShip2Input();

        this.ship1.render(this.ctx, input1.thrust);
        this.ship2.render(this.ctx, input2.thrust);

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
     * Render UI elements
     */
    renderUI() {
        // Ship status
        this.ship1.renderUI(this.ctx, 20, 30);
        this.ship2.renderUI(this.ctx, this.canvas.width - 180, 30);

        // Controls help (only in PvP mode)
        if (this.gameMode === 'pvp') {
            this.ctx.save();
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('Player 1: W=Thrust A/D=Rotate V=Shoot', 20, this.canvas.height - 20);
            this.ctx.fillText('Player 2: \u2191=Thrust \u2190/\u2192=Rotate RCtrl=Shoot', 20, this.canvas.height - 5);
            this.ctx.restore();
        } else if (this.gameMode === 'ai') {
            this.ctx.save();
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('Player: W=Thrust A/D=Rotate V=Shoot', 20, this.canvas.height - 20);
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


        // Game objective
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('OBJECTIVE:', this.canvas.width / 2, 310);
        this.ctx.font = '22px monospace';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText('Defeat your opponent with lasers and avoid the sun\'s gravity!', this.canvas.width / 2, 340);

        // Controls
        this.ctx.font = 'bold 22px monospace';
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.fillText('PLAYER 1 CONTROLS:', this.canvas.width / 2, 450);
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.fillText('W = Thrust | A/D = Rotate | V = Shoot', this.canvas.width / 2, 475);

        this.ctx.font = 'bold 22px; monospace';
        this.ctx.fillStyle = '#FF1493';
        this.ctx.fillText('PLAYER 2 CONTROLS:', this.canvas.width / 2, 515);
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#FF88CC';
        this.ctx.fillText('↑ = Thrust | ←/→ = Rotate | Right Ctrl = Shoot', this.canvas.width / 2, 540);

        // Sound toggle
        this.ctx.font = '20px monospace';
        this.ctx.fillStyle = this.soundManager.isEnabled() ? '#00FF00' : '#FF0000';
        const soundStatus = this.soundManager.isEnabled() ? 'ON' : 'OFF';
        this.ctx.fillText(`Press M: Sound ${soundStatus}`, this.canvas.width / 2, 630);

        // Author credits
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = 'rgba(221, 221, 221, 1)';
        this.ctx.fillText('Author: Robert Bielka (Bildo) and AI on 31. 1. 2026', this.canvas.width / 2, this.canvas.height - 80);

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
        } else if (this.input.isKeyPressed('m') || this.input.isKeyPressed('M')) {
            this.soundManager.toggle();
        }
    }

    /**
     * Start the game with selected mode
     */
    startGame(mode) {
        this.gameMode = mode;
        this.state = 'playing';

        // Reset ships
        this.ship1.lives = 10;
        this.ship1.position.copy(this.ship1.startPosition);
        this.ship1.velocity.set(0, 0);
        this.ship1.angle = this.ship1.startAngle;
        this.ship1.active = true;
        this.ship1.respawnTimer = 0;

        this.ship2.lives = 10;
        this.ship2.position.copy(this.ship2.startPosition);
        this.ship2.velocity.set(0, 0);
        this.ship2.angle = this.ship2.startAngle;
        this.ship2.active = true;
        this.ship2.respawnTimer = 0;

        // Clear bullets
        this.bullets = [];

        // Initialize AI if needed
        if (mode === 'ai') {
            this.ai = new AI(this.ship2, this.ship1, this.sun);
            this.ai.setDifficulty('medium');
        } else {
            this.ai = null;
        }
    }

    /**
     * Handle game over input
     */
    handleGameOverInput() {
        if (this.input.isKeyPressed(' ') || this.input.isKeyPressed('Space')) {
            this.state = 'menu';
            this.gameMode = null;
        }
    }
}
