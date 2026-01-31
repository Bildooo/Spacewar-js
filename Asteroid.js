/**
 * Asteroid.js
 * Floating space hazard
 */

class Asteroid {
    constructor(x, y, radius, velocity) {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.velocity = velocity;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        // Generate jagged shape
        this.points = [];
        const numPoints = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            const dist = radius * (0.8 + Math.random() * 0.4); // Variation in radius
            this.points.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            });
        }

        this.active = true;
    }

    update(canvasWidth, canvasHeight) {
        this.position.add(this.velocity);
        this.angle += this.rotationSpeed;

        // Circular wrapping (polar coordinates)
        const dx = this.position.x - canvasWidth / 2;
        const dy = this.position.y - canvasHeight / 2;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        const playRadius = canvasHeight / 2 - 10;

        if (distanceFromCenter > playRadius) {
            // Wrap to opposite side through center
            const angle = Math.atan2(dy, dx);
            this.position.x = canvasWidth / 2 - Math.cos(angle) * playRadius * 0.9;
            this.position.y = canvasHeight / 2 - Math.sin(angle) * playRadius * 0.9;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#222222';

        ctx.beginPath();
        const start = this.points[0];
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < this.points.length; i++) {
            const p = this.points[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Break into debris particles
     */
    break() {
        const particles = [];
        const count = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            particles.push({
                x: this.position.x,
                y: this.position.y,
                vx: Math.cos(angle) * speed + this.velocity.x * 0.5,
                vy: Math.sin(angle) * speed + this.velocity.y * 0.5,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                color: '#AAAAAA'
            });
        }
        return particles;
    }
}
