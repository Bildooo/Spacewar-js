/**
 * Bullet.js
 * Projectile fired from ships
 */

class Bullet {
    constructor(x, y, angle, shipVelocity, ownerId, color = '#FF6666') {
        this.position = new Vector2(x, y);
        this.velocity = shipVelocity.clone();

        // Add bullet's own velocity in direction of angle
        const bulletSpeed = 4;
        this.velocity.x += Math.cos(angle) * bulletSpeed;
        this.velocity.y += Math.sin(angle) * bulletSpeed;

        this.radius = 2;
        this.mass = 0.1; // Much lighter than ships
        this.active = true;
        this.ownerId = ownerId; // Don't hit own ship
        this.color = color; // Bullet color matches ship

        // Bullet lifetime and trail
        this.lifetime = 200; // Frames before disappearing
        this.maxLifetime = 200;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    /**
     * Apply a force to the bullet (mainly gravity)
     */
    applyForce(force) {
        // F = ma, so a = F/m
        const acceleration = Vector2.multiply(force, 1 / this.mass);
        this.velocity.add(acceleration);
    }

    /**
     * Update bullet position and age
     */
    update(canvasWidth, canvasHeight) {
        if (!this.active) return;

        // Update position
        this.position.add(this.velocity);

        // Age the bullet
        this.age++;
        if (this.age >= this.lifetime) {
            this.active = false;
        }

        // Deactivate if off screen
        if (this.position.x < 0 || this.position.x > canvasWidth ||
            this.position.y < 0 || this.position.y > canvasHeight) {
            this.active = false;
        }
    }

    /**
     * Check collision with a circular object
     */
    checkCollision(position, radius) {
        if (!this.active) return false;
        const distance = this.position.distanceTo(position);
        return distance < (this.radius + radius);
    }

    /**
     * Render the bullet with trail
     */
    render(ctx) {
        ctx.save();

        // Draw trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.4;
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.stroke();
        }

        // Draw bullet as a glowing line in direction of movement
        ctx.globalAlpha = 1;
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        const lineLength = 8;

        const x1 = this.position.x - Math.cos(angle) * lineLength / 2;
        const y1 = this.position.y - Math.sin(angle) * lineLength / 2;
        const x2 = this.position.x + Math.cos(angle) * lineLength / 2;
        const y2 = this.position.y + Math.sin(angle) * lineLength / 2;

        // Glow effect
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Bright core
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Deactivate the bullet
     */
    destroy() {
        this.active = false;
    }
}
