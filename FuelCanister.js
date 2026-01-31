/**
 * FuelCanister.js
 * collectible item that replenishes ship fuel
 */
class FuelCanister {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.radius = 12; // Collision radius
        this.fuelAmount = 250;
        this.active = true;

        // Pulse effect
        this.pulseTimer = 0;
    }

    update(canvasWidth, canvasHeight) {
        this.position.add(this.velocity);
        this.angle += this.rotationSpeed;
        this.pulseTimer += 0.05;

        // Circular movement constraint (bounce off walls)
        const dx = this.position.x - canvasWidth / 2;
        const dy = this.position.y - canvasHeight / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const playRadius = canvasHeight / 2 - 20; // Slightly smaller than play area (10) for buffer

        if (dist > playRadius) {
            // Calculate normal vector at collision point
            const normalX = dx / dist;
            const normalY = dy / dist;

            // Reflect velocity: result = v - 2 * (v . n) * n
            const dotProduct = this.velocity.x * normalX + this.velocity.y * normalY;
            this.velocity.x -= 2 * dotProduct * normalX;
            this.velocity.y -= 2 * dotProduct * normalY;

            // Push back inside
            this.position.x = canvasWidth / 2 + normalX * playRadius;
            this.position.y = canvasHeight / 2 + normalY * playRadius;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        // Pulse scale
        const scale = 1 + Math.sin(this.pulseTimer) * 0.1;
        ctx.scale(scale, scale);

        // Draw Canister body (Orange rectangle)
        ctx.fillStyle = '#FFA500'; // Orange
        ctx.strokeStyle = '#FFD700'; // Gold border
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFA500';

        ctx.beginPath();
        ctx.rect(-8, -10, 16, 20);
        ctx.fill();
        ctx.stroke();

        // Draw "F" or stripe
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('F', 0, 0);

        // Cap
        ctx.fillStyle = '#888888';
        ctx.fillRect(-4, -14, 8, 4);

        ctx.restore();
    }
}
