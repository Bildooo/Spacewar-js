/**
 * Sun.js
 * Central gravitational object in the game
 */

class Sun {
    constructor(x, y, mass, radius) {
        this.position = new Vector2(x, y);
        this.mass = mass;
        this.radius = radius;
    }

    /**
     * Calculate gravitational force on an object
     * F = G * (m1 * m2) / r^2
     * Returns a force vector
     */
    getGravitationalForce(objectPosition, objectMass, G = 1) {
        // Vector from object to sun
        const direction = Vector2.subtract(this.position, objectPosition);
        const distanceSquared = direction.magnitudeSquared();
        const distance = Math.sqrt(distanceSquared);

        // Avoid division by zero and extreme forces when too close
        if (distance < this.radius) {
            return new Vector2(0, 0);
        }

        // Calculate force magnitude
        const forceMagnitude = (G * this.mass * objectMass) / distanceSquared;

        // Normalize direction and multiply by force magnitude
        direction.normalize();
        direction.multiply(forceMagnitude);

        return direction;
    }

    /**
     * Check if a point is colliding with the sun
     */
    isColliding(position, objectRadius = 0) {
        const distance = this.position.distanceTo(position);
        return distance < (this.radius + objectRadius);
    }

    /**
     * Render the sun
     */
    render(ctx) {
        ctx.save();

        // Draw outer glow
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.3,
            this.position.x, this.position.y, this.radius * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw sun body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner highlight
        ctx.fillStyle = '#FFFF99';
        ctx.beginPath();
        ctx.arc(this.position.x - this.radius * 0.2, this.position.y - this.radius * 0.2, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
