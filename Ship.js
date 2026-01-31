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
        this.lives = 5;
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
            this.updateExplosion();
            return;
        }

        // Update position
        this.position.add(this.velocity);

        // Add to trail
        this.trail.push(this.position.clone());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Circular wrapping (polar coordinates)
        const dx = this.position.x - canvasWidth / 2;
        const dy = this.position.y - canvasHeight / 2;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        const playRadius = canvasHeight / 2 - 10; // Match game play area radius

        if (distanceFromCenter > playRadius) {
            // Wrap to opposite side through center
            const angle = Math.atan2(dy, dx);
            this.position.x = canvasWidth / 2 - Math.cos(angle) * playRadius * 0.9;
            this.position.y = canvasHeight / 2 - Math.sin(angle) * playRadius * 0.9;
        }
    }

    /**
     * Shoot a bullet
     */
    shoot() {
        if (this.shootCooldown > 0 || !this.active) return null;

        // Create bullet at ship's nose
        const bulletX = this.position.x + Math.cos(this.angle) * this.radius;
        const bulletY = this.position.y + Math.sin(this.angle) * this.radius;

        this.shootCooldown = this.shootCooldownMax;

        return new Bullet(bulletX, bulletY, this.angle, this.velocity, this.id, this.color);
    }

    /**
     * Handle collision with sun or other objects
     */
    die(soundManager = null) {
        if (!this.active) return;

        this.lives--;
        this.active = false;
        this.respawnTimer = this.respawnDelay;

        // Clear trail so it doesn't stay on screen
        this.trail = [];

        // Play explosion sound
        if (soundManager) {
            soundManager.play('explosion');
        }

        // Create explosion particles at current position (explicitly passed)
        this.createExplosion(this.position.x, this.position.y);

        // Then reset position (will be handled in update based on respawn timer)
        // Note: we don't reset position immediately to avoid glitching, logic is in update()
        // But active=false prevents drawing/updating physics
    }

    /**
     * Create explosion effect
     */
    /**
     * Create explosion effect
     */
    createExplosion(x, y) {
        // Use provided coordinates or fall back to current position
        const originX = x !== undefined ? x : this.position.x;
        const originY = y !== undefined ? y : this.position.y;

        const particleCount = 20;
        this.explosionParticles = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;

            this.explosionParticles.push({
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed + (Math.random() - 0.5),
                vy: Math.sin(angle) * speed + (Math.random() - 0.5),
                life: 1.0,
                maxLife: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                length: 5 + Math.random() * 10
            });
        }
    }

    /**
     * Update explosion particles
     */
    updateExplosion() {
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
            const p = this.explosionParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

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

        this.active = true;
        this.respawnTimer = 0;
        this.velocity.set(0, 0);
        this.angle = this.startAngle;
        this.position.copy(this.startPosition);

        // Clear residuals
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
            ctx.lineTo(-this.radius * 5.0, 0); // Extended flame length (2.5 -> 5.0)
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

        // Different shapes for each ship
        if (this.id === 1) {
            // Ship 1: Pointed tail (goes outward)
            ctx.lineTo(-this.radius, this.radius); // Bottom left
            ctx.lineTo(-this.radius * 1.3, 0); // Tail point (goes OUTWARD)
            ctx.lineTo(-this.radius, -this.radius); // Top left
        } else {
            // Ship 2: Classic triangle with indent
            ctx.lineTo(-this.radius, this.radius); // Bottom left
            ctx.lineTo(-this.radius * 0.5, 0); // Back center (indent)
            ctx.lineTo(-this.radius, -this.radius); // Top left
        }

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
