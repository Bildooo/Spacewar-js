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
        this.thrustPower = 0.07;
        this.rotationSpeed = 0.05;

        // State
        this.lives = 10;
        this.active = true;
        this.respawnTimer = 0;
        this.respawnDelay = 120; // Frames

        // Starting position for respawn
        this.startPosition = new Vector2(x, y);
        this.startAngle = angle;

        // Shooting
        this.shootCooldown = 0;
        this.shootCooldownMax = 30; // Frames between shots

        // Visual effects
        this.trail = []; // Position history for trail
        this.maxTrailLength = 15;
        this.explosionParticles = []; // Debris on death
    }

    thrust() {
        if (!this.active) return;

        const thrustVector = Vector2.fromAngle(this.angle);
        thrustVector.multiply(this.thrustPower);
        this.velocity.add(thrustVector);

        // Limit maximum velocity
        const maxSpeed = 2.25;
        if (this.velocity.magnitude() > maxSpeed) {
            this.velocity.normalize().multiply(maxSpeed);
        }
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
            // Update explosion particles
            this.updateExplosionParticles();
            return;
        }

        // Update position
        this.position.add(this.velocity);

        // Add to trail
        this.trail.push(this.position.clone());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

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

        // Clear trail so it doesn't stay on screen
        this.trail = [];

        // Create explosion particles
        this.createExplosion();
    }

    /**
     * Create explosion effect
     */
    createExplosion() {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 2;
            this.explosionParticles.push({
                x: this.position.x,
                y: this.position.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30, // 0.5 seconds at 60fps
                maxLife: 30,
                length: 5 + Math.random() * 5
            });
        }
    }

    /**
     * Update explosion particles
     */
    updateExplosionParticles() {
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const p = this.explosionParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.explosionParticles.splice(i, 1);
            }
        }
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
        this.trail = [];
        this.explosionParticles = [];
    }

    /**
     * Render the ship
     */
    render(ctx, showThrust = false) {
        // Render trail first (behind ship)
        this.renderTrail(ctx);

        // Render explosion particles if dead
        if (!this.active) {
            this.renderExplosion(ctx);
            return;
        }

        ctx.save();

        // Draw glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        // Draw thrust flame
        if (showThrust) {
            ctx.fillStyle = '#FF9900';
            ctx.shadowColor = '#FF9900';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(-this.radius, this.radius * 0.5);
            ctx.lineTo(-this.radius * 1.8, 0);
            ctx.lineTo(-this.radius, -this.radius * 0.5);
            ctx.closePath();
            ctx.fill();
        }

        // Draw ship body (triangle)
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
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
     * Render ship trail
     */
    renderTrail(ctx) {
        if (this.trail.length < 2) return;

        ctx.save();
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.5;
            const width = (i / this.trail.length) * 3;

            ctx.strokeStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = width;
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render explosion particles
     */
    renderExplosion(ctx) {
        ctx.save();
        for (const p of this.explosionParticles) {
            const alpha = p.life / p.maxLife;
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;

            const endX = p.x + Math.cos(Math.atan2(p.vy, p.vx)) * p.length;
            const endY = p.y + Math.sin(Math.atan2(p.vy, p.vx)) * p.length;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
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
