/**
 * Ship.js
 * Player-controlled spaceship with Newtonian physics
 */

class Ship {
    constructor(x, y, angle, id, color) {
        this.id = id;
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.angle = angle; // Radians
        this.mass = 1;
        this.radius = 10;
        this.color = color;

        // Control parameters
        this.thrustPower = 0.05;
        this.rotationSpeed = 0.05;

        // State
        this.lives = 3;
        this.active = true;
        this.respawnTimer = 0;
        this.respawnDelay = 120; // Frames

        // Starting position for respawn
        this.startPosition = new Vector2(x, y);
        this.startAngle = angle;

        // Shooting
        this.shootCooldown = 0;
        this.shootCooldownMax = 30; // Frames between shots
    }

    /**
     * Apply thrust in the direction the ship is facing
     */
    thrust() {
        if (!this.active) return;

        const thrustVector = Vector2.fromAngle(this.angle);
        thrustVector.multiply(this.thrustPower);
        this.velocity.add(thrustVector);
        if (this.velocity > 3) this.velocity = 3;

    }

    /**
     * Rotate the ship
     */
    rotate(direction) {
        if (!this.active) return;
        this.angle += direction * this.rotationSpeed;
    }

    /**
     * Apply a force to the ship (mainly gravity)
     */
    applyForce(force) {
        // F = ma, so a = F/m
        const acceleration = Vector2.multiply(force, 1 / this.mass);
        this.velocity.add(acceleration);
    }

    /**
     * Update ship position and state
     */
    update(canvasWidth, canvasHeight) {
        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Handle respawn
        if (!this.active) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // Update position
        this.position.add(this.velocity);

        // Screen wrapping
        if (this.position.x < 0) this.position.x = canvasWidth;
        if (this.position.x > canvasWidth) this.position.x = 0;
        if (this.position.y < 0) this.position.y = canvasHeight;
        if (this.position.y > canvasHeight) this.position.y = 0;
    }

    /**
     * Attempt to shoot a bullet
     */
    shoot() {
        if (!this.active || this.shootCooldown > 0) return null;

        // Create bullet at ship position with ship velocity + bullet velocity
        const bulletVelocity = Vector2.fromAngle(this.angle);
        bulletVelocity.multiply(5); // Bullet speed relative to ship
        bulletVelocity.add(this.velocity); // Add ship's velocity

        const bullet = new Bullet(
            this.position.x,
            this.position.y,
            bulletVelocity,
            this.id
        );

        this.shootCooldown = this.shootCooldownMax;
        return bullet;
    }

    /**
     * Handle collision with sun or other objects
     */
    die() {
        if (!this.active) return;

        this.lives--;
        this.active = false;
        this.respawnTimer = this.respawnDelay;
    }

    /**
     * Respawn the ship at starting position
     */
    respawn() {
        if (this.lives <= 0) return;

        this.position.copy(this.startPosition);
        this.velocity.set(0, 0);
        this.angle = this.startAngle;
        this.active = true;
    }

    /**
     * Render the ship
     */
    render(ctx, showThrust = false) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        // Draw thrust flame
        if (showThrust) {
            ctx.fillStyle = '#FF9900';
            ctx.beginPath();
            ctx.moveTo(-this.radius, this.radius * 0.5);
            ctx.lineTo(-this.radius * 1.8, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.5);
            ctx.closePath();
            ctx.fill();
        }

        // Draw ship body (triangle)
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Nose
        ctx.lineTo(-this.radius, this.radius); // Bottom left
        ctx.lineTo(-this.radius * 0.5, 0); // Back center
        ctx.lineTo(-this.radius, -this.radius); // Top left
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.fill();

        ctx.restore();
    }

    /**
     * Render ship lives/status
     */
    renderUI(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = '16px monospace';
        ctx.fillText(`Player ${this.id}: ${this.lives} lives`, x, y);
        ctx.restore();
    }
}
