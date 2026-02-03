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
        this.explosionParticles = []; // Debris on death

        // Advanced features
        this.maxEnergy = 100;
        this.energy = 100;
        this.shieldActive = false;
        this.shieldActive = false;
        this.hyperspaceCharges = 3;
        this.hyperspaceCooldown = 0;
        this.hyperspaceCooldownMax = 60; // 1 second debounce

        // Fuel system
        this.maxFuel = 1000;
        this.fuel = 1000;
        this.fuelEnabled = false; // Toggled by game
    }

    thrust() {
        if (!this.active) return;

        // Fuel check
        if (this.fuelEnabled) {
            if (this.fuel <= 0) return;
            this.fuel -= 1.5; // Consumption rate
        }

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
     * Activate hyperspace drive
     */
    hyperspace(soundManager) {
        if (!this.active || this.hyperspaceCooldown > 0 || this.hyperspaceCharges <= 0) return;

        // Consume charge
        this.hyperspaceCharges--;

        // debounce
        this.hyperspaceCooldown = this.hyperspaceCooldownMax;

        // 15% chance of mulfunction (explosion)
        if (Math.random() < 0.15) {
            this.die(soundManager);
            return;
        }

        // Play hyperspace sound
        if (soundManager) {
            soundManager.play('hyperspace');
        }

        // Random positions
        // We need canvas dimensions, but we can approximate or rely on wraplogic
        // For now, let's use a wide random range which wrap() will fix next frame if out of bounds
        this.position.x = Math.random() * 800;
        this.position.y = Math.random() * 800;

        // Reset velocity
        this.velocity.set(0, 0);

        // Create entrance effect (explosion particles without death)
        this.createExplosion(this.position.x, this.position.y);
    }

    /**
     * Toggle shield
     */
    setShield(active) {
        if (!this.active) {
            this.shieldActive = false;
            return;
        }

        if (active && this.energy > 5) {
            this.shieldActive = true;
        } else {
            this.shieldActive = false;
        }
    }

    /**
     * Rotate the ship
     */
    rotate(direction) {
        if (!this.active) return;

        // Rotation consumes small amount of fuel too?
        // User said "after its consumption it would not be controllable"
        if (this.fuelEnabled) {
            if (this.fuel <= 0) return;
            this.fuel -= 0.2;
        }

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
        if (this.hyperspaceCooldown > 0) {
            this.hyperspaceCooldown--;
        }

        // Handle Energy / Shield
        if (this.shieldActive) {
            this.energy -= 0.5; // Drain energy
            if (this.energy <= 0) {
                this.energy = 0;
                this.shieldActive = false;
            }
        } else {
            if (this.energy < this.maxEnergy) {
                this.energy += 0.025; // Regenerate energy (Much slower: 0.05 -> 0.025)
            }
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
        // Update position
        this.position.add(this.velocity);

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

        this.respawnTimer = this.respawnDelay;

        this.shieldActive = false;
        this.energy = this.maxEnergy;

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

        this.resetToStart();
        this.active = true;
        this.respawnTimer = 0;
    }

    /**
     * Reset ship to start conditions (full resources, start pos)
     */
    resetToStart() {
        this.velocity.set(0, 0);
        this.angle = this.startAngle;
        this.position.copy(this.startPosition);

        // Clear residuals
        // Clear residuals
        this.explosionParticles = [];
        this.energy = this.maxEnergy;
        this.fuel = this.maxFuel;
        this.shieldActive = false;
        this.hyperspaceCooldown = 0;
        this.hyperspaceCharges = 3; // Reset charges on new round
    }

    /**
     * Render the ship
     */
    render(ctx, showThrust = false) {
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

        // Draw Shield
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = '#00FFFF';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.fill();
            ctx.restore();
        }

        // Draw thrust flame
        // Only show if thrusting AND (fuel is disabled OR we have fuel)
        const hasFuel = !this.fuelEnabled || this.fuel > 0;
        if (showThrust && hasFuel) {
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

        // Larger Score/Lives
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`Lives: ${this.lives}`, x, y);

        // Draw Energy Bar
        const barWidth = 100;
        const barHeight = 6;
        const barX = x;
        const barY = y + 15;

        // Shield Label
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '10px monospace';
        ctx.fillText('SHIELD', barX, barY - 2);

        // Background
        ctx.fillStyle = '#444444';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Fill
        const energyRatio = this.energy / this.maxEnergy;
        ctx.fillStyle = this.energy > 20 ? '#00FFFF' : '#FF0000';
        ctx.fillRect(barX, barY, barWidth * energyRatio, barHeight);

        // Hyperspace Charges (Squares)
        const squareSize = 8;
        const spacing = 4;
        for (let i = 0; i < 3; i++) {
            if (i < this.hyperspaceCharges) {
                ctx.fillStyle = '#00FF00'; // Available
            } else {
                ctx.fillStyle = '#444444'; // Used
            }
            ctx.fillRect(barX + barWidth + 10 + (i * (squareSize + spacing)), barY - 2, squareSize, squareSize);
        }

        // Fuel Bar (Yellow) - Only if enabled
        if (this.fuelEnabled) {
            const fuelY = barY + barHeight + 12; // Adjusted spacing for labels

            // Fuel Label
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText('FUEL', barX, fuelY - 2);

            ctx.fillStyle = '#444444';
            ctx.fillRect(barX, fuelY, barWidth, barHeight);

            const fuelRatio = this.fuel / this.maxFuel;
            ctx.fillStyle = this.fuel > 100 ? '#FFD700' : '#FF4500';
            ctx.fillRect(barX, fuelY, barWidth * fuelRatio, barHeight);
        }
        ctx.restore();
        ctx.restore();
    }

    /**
     * Add fuel to the tank
     */
    addFuel(amount) {
        if (!this.active) return;
        this.fuel += amount;
        if (this.fuel > this.maxFuel) {
            this.fuel = this.maxFuel;
        }
    }
}
