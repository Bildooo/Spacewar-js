/**
 * Game.js
 * Main game logic and loop
 */

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 1200;
        this.canvas.height = 800;

        // Game objects
        this.sun = new Sun(
            this.canvas.width / 2,
            this.canvas.height / 2,
            1000, // mass
            30    // radius
        );

        // Create ships
        this.ship1 = new Ship(
            150,
            this.canvas.height / 2,
            0, // angle (pointing right)
            1,
            '#00BFFF' // blue
        );

        this.ship2 = new Ship(
            this.canvas.width - 150,
            this.canvas.height / 2,
            Math.PI, // angle (pointing left)
            2,
            '#FF1493' // pink
        );

        this.bullets = [];

        // Input system
        this.input = new Input();

        // Physics constants
        this.G = 0.5; // Gravitational constant

        // Game state
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

        // Update and render
        this.update();
        this.render();

        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    /**
     * Update game state
     */
    update() {
        // Get input for both ships
        const input1 = this.input.getShip1Input();
        const input2 = this.input.getShip2Input();

        // Handle Ship 1 input
        if (input1.rotateLeft) this.ship1.rotate(-1);
        if (input1.rotateRight) this.ship1.rotate(1);
        if (input1.thrust) this.ship1.thrust();
        if (input1.shoot) {
            const bullet = this.ship1.shoot();
            if (bullet) this.bullets.push(bullet);
        }

        // Handle Ship 2 input
        if (input2.rotateLeft) this.ship2.rotate(-1);
        if (input2.rotateRight) this.ship2.rotate(1);
        if (input2.thrust) this.ship2.thrust();
        if (input2.shoot) {
            const bullet = this.ship2.shoot();
            if (bullet) this.bullets.push(bullet);
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
                this.ship1.die();
                this.bullets.splice(i, 1);
                continue;
            }

            if (bullet.ownerId !== this.ship2.id &&
                bullet.checkCollision(this.ship2.position, this.ship2.radius)) {
                this.ship2.die();
                this.bullets.splice(i, 1);
                continue;
            }
        }

        // Update ships
        this.ship1.update(this.canvas.width, this.canvas.height);
        this.ship2.update(this.canvas.width, this.canvas.height);

        // Check ship collision with sun
        if (this.sun.isColliding(this.ship1.position, this.ship1.radius)) {
            this.ship1.die();
        }
        if (this.sun.isColliding(this.ship2.position, this.ship2.radius)) {
            this.ship2.die();
        }
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
     * Draw simple star background
     */
    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        // Use deterministic positions based on canvas size
        const seed = 12345;
        for (let i = 0; i < 100; i++) {
            const x = ((seed * i * 17) % this.canvas.width);
            const y = ((seed * i * 31) % this.canvas.height);
            const size = ((i * 7) % 3) * 0.5;

            this.ctx.globalAlpha = 0.3 + ((i % 7) / 10);
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Render UI elements
     */
    renderUI() {
        // Ship status
        this.ship1.renderUI(this.ctx, 20, 30);
        this.ship2.renderUI(this.ctx, this.canvas.width - 180, 30);

        // Controls help
        this.ctx.save();
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('Player 1: W=Thrust A/D=Rotate S=Shoot', 20, this.canvas.height - 40);
        this.ctx.fillText('Player 2: ↑=Thrust ←/→=Rotate RCtrl=Shoot', 20, this.canvas.height - 20);
        this.ctx.restore();

        // Check for game over
        if (this.ship1.lives <= 0 || this.ship2.lives <= 0) {
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

        this.ctx.font = '20px monospace';
        this.ctx.fillText('Refresh page to play again', this.canvas.width / 2, this.canvas.height / 2 + 50);

        this.ctx.restore();
    }
}
