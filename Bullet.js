/**
 * Bullet.js
 * Projectile fired from ships
 */

class Bullet {
    constructor(x, y, velocity, ownerId) {
        this.position = new Vector2(x, y);
        this.velocity = velocity.clone();
        this.mass = 0.1; // Small mass compared to ships
        this.radius = 2;
        this.ownerId = ownerId; // Which ship fired this bullet
        this.lifetime = 300; // Frames before bullet expires
        this.age = 0;
        this.active = true;
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
     * Render the bullet
     */
    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw bullet trail
        const trailLength = Math.min(this.velocity.magnitude() * 2, 10);
        const trailDirection = this.velocity.clone().normalize().multiply(-trailLength);

        const gradient = ctx.createLinearGradient(
            this.position.x, this.position.y,
            this.position.x + trailDirection.x, this.position.y + trailDirection.y
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.radius * 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x + trailDirection.x, this.position.y + trailDirection.y);
        ctx.stroke();

        // Draw bullet
        ctx.fillStyle = '#FF6666';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Deactivate the bullet
     */
    destroy() {
        this.active = false;
    }
}
