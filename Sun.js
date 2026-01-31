/**
 * Sun.js
 * Central gravitational object in the game
 */

class Sun {
    constructor(x, y, mass, radius) {
        this.position = new Vector2(x, y);
        this.mass = mass;
        this.radius = radius;

        // Gravitational field visualization particles
        this.gravityParticles = [];
        this.initGravityParticles();
    }

    /**
     * Initialize gravity field particles
     */
    initGravityParticles() {
        const particleCount = 30; // Increased for better coverage
        const maxDistance = 380; // Will cover most of play area

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Spawn particles across entire play area
            const distance = 30 + Math.random() * 370; // Reduced radius by 30px (400 -> 370)

            this.gravityParticles.push({
                angle: angle,
                distance: distance,
                baseSpeed: 0.2 + Math.random() * 0.3,
                size: 0.8 + Math.random() * 1.5, // Smaller particles
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    /**
     * Update gravity particles
     */
    updateGravityParticles() {
        for (const particle of this.gravityParticles) {
            // Calculate acceleration based on distance (gravity gets stronger closer to sun)
            // Using inverse square for realistic gravity: closer = faster
            const normalizedDist = particle.distance / 430; // Updated max distance (30 + 400)
            const acceleration = 1 + (1 - normalizedDist) * 3; // 1x to 4x speed
            const currentSpeed = particle.baseSpeed * acceleration;

            // Pull particle towards sun
            particle.distance -= currentSpeed;

            // Reset particle when it gets too close
            if (particle.distance < 30) {
                particle.distance = 380; // Reset to edge (30 + 370)
                particle.angle = Math.random() * Math.PI * 2;
            }
        }
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

        // Draw gravity field particles first
        this.renderGravityParticles(ctx);

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

    /**
     * Render gravity field particles
     */
    renderGravityParticles(ctx) {
        ctx.save();
        for (const particle of this.gravityParticles) {
            const x = this.position.x + Math.cos(particle.angle) * particle.distance;
            const y = this.position.y + Math.sin(particle.angle) * particle.distance;

            ctx.fillStyle = `rgba(150, 150, 150, ${particle.opacity})`;
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'rgba(150, 150, 150, 0.5)';

            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
