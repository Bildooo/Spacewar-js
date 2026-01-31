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

        // Wrap around screen
        if (this.position.x < 0) this.position.x += canvasWidth;
        if (this.position.x > canvasWidth) this.position.x -= canvasWidth;
        if (this.position.y < 0) this.position.y += canvasHeight;
        if (this.position.y > canvasHeight) this.position.y -= canvasHeight;
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
