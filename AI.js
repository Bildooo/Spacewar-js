/**
 * AI.js
 * Simple AI controller for computer-controlled ship
 */

class AI {
    constructor(ship, enemyShip, sun) {
        this.ship = ship;
        this.enemyShip = enemyShip;
        this.sun = sun;

        // AI behavior parameters
        this.updateInterval = 10; // Update AI decisions every N frames
        this.frameCounter = 0;

        // AI state
        this.targetAngle = 0;
        this.shouldThrust = false;
        this.shouldShoot = false;
        this.shouldShield = false;
        this.shouldHyperspace = false;

        // Difficulty settings
        this.aimAccuracy = 0.9; // 0-1, how accurate the AI aims
        this.reactionTime = 15; // Frames of delay in reactions
        this.shootProbability = 0.3; // Chance to shoot when aimed
        this.shootAngleThreshold = 0.3; // How precise aiming needs to be to shoot
        this.safeDistanceFromSun = 250; // Minimum distance from sun
        this.criticalDistanceFromSun = 200; // Distance at which to start worrying
    }

    /**
     * Update AI decision making
     */
    update() {
        if (!this.ship.active || !this.enemyShip.active) {
            return {
                rotateLeft: false,
                rotateRight: false,
                thrust: false,
                rotateLeft: false,
                rotateRight: false,
                thrust: false,
                shoot: false,
                hyperspace: false,
                shield: false
            };
        }

        this.frameCounter++;

        // Only update decisions periodically (simulates thinking time)
        if (this.frameCounter % this.updateInterval === 0) {
            this.makeDecisions();
        }

        // Execute current decisions
        return this.executeActions();
    }

    /**
     * Make strategic decisions
     */
    makeDecisions() {
        const distanceToSun = this.ship.position.distanceTo(this.sun.position);
        const distanceToEnemy = this.ship.position.distanceTo(this.enemyShip.position);

        // Check if we're moving towards the sun
        const directionToSun = Vector2.subtract(this.sun.position, this.ship.position);
        directionToSun.normalize();
        const velocityNormalized = this.ship.velocity.clone().normalize();
        const dotProduct = directionToSun.x * velocityNormalized.x + directionToSun.y * velocityNormalized.y;
        const movingTowardsSun = dotProduct > 0.3; // Positive means moving towards sun

        // Priority 1: Avoid the sun if too close OR moving towards it from critical distance
        if (distanceToSun < this.safeDistanceFromSun ||
            (distanceToSun < this.criticalDistanceFromSun && movingTowardsSun)) {
            this.avoidSun();
            this.shouldShoot = false;
            return;
        }

        // Priority 2: Defensive behavior (Shields/Hyperspace)
        this.defensiveBehavior(distanceToSun, distanceToEnemy);

        // Priority 3: Combat behavior
        this.combatBehavior();
    }

    /**
     * Defensive behavior
     */
    defensiveBehavior(distanceToSun, distanceToEnemy) {
        this.shouldShield = false;
        this.shouldHyperspace = false;

        // EMERGENCY: Hyperspace if too close to sun and falling in
        if (distanceToSun < 50) {
            this.shouldHyperspace = true;
            return;
        }

        // Use shield if bullets are close
        // We'd need access to game bullets, but we don't have it easily here without passing Game to AI
        // So we'll implement a simple distance check to enemy if they are shooting
        // Or we could cheat and assume if enemy is facing us and close, they might shoot

        // Simpler logic: Shield if enemy is close and facing us
        if (distanceToEnemy < 200) {
            // Check if enemy aiming at us
            const dirToUs = Vector2.subtract(this.ship.position, this.enemyShip.position);
            const angleToUs = Math.atan2(dirToUs.y, dirToUs.x);
            const angleDiff = this.getAngleDifference(this.enemyShip.angle, angleToUs);

            if (Math.abs(angleDiff) < 0.2) {
                this.shouldShield = true;
            }
        }
    }

    /**
     * Avoid getting too close to the sun
     */
    avoidSun() {
        const directionToSun = Vector2.subtract(this.sun.position, this.ship.position);
        const angleToSun = Math.atan2(directionToSun.y, directionToSun.x);
        const distanceToSun = this.ship.position.distanceTo(this.sun.position);

        // Point away from sun
        this.targetAngle = angleToSun + Math.PI;

        // Thrust more aggressively when closer to sun
        this.shouldThrust = true;
    }

    /**
     * Combat behavior - aim and shoot at enemy
     */
    combatBehavior() {
        const distanceToEnemy = this.ship.position.distanceTo(this.enemyShip.position);

        // Calculate where to aim (predict enemy position)
        const prediction = this.predictEnemyPosition();
        const directionToTarget = Vector2.subtract(prediction, this.ship.position);
        const angleToTarget = Math.atan2(directionToTarget.y, directionToTarget.x);

        // Add some randomness based on accuracy
        const aimError = (1 - this.aimAccuracy) * (Math.random() - 0.5) * Math.PI * 0.5;
        this.targetAngle = angleToTarget + aimError;

        // Decide whether to thrust (maintain distance or approach)
        const optimalDistance = 300;
        if (distanceToEnemy > optimalDistance) {
            // Too far, approach enemy
            this.shouldThrust = Math.random() > 0.3;
        } else if (distanceToEnemy < 200) {
            // Too close, back off (don't thrust directly at enemy)
            const angleDiff = this.getAngleDifference(this.ship.angle, angleToTarget);
            this.shouldThrust = Math.abs(angleDiff) > Math.PI / 2;
        } else {
            // Good distance, maneuver
            this.shouldThrust = Math.random() > 0.5;
        }

        // Shoot if aimed roughly at target - use difficulty threshold
        const currentAngleDiff = this.getAngleDifference(this.ship.angle, angleToTarget);
        this.shouldShoot = Math.abs(currentAngleDiff) < this.shootAngleThreshold && Math.random() < this.shootProbability;
    }

    /**
     * Predict where the enemy will be
     */
    predictEnemyPosition() {
        // Simple prediction: enemy position + velocity * prediction frames
        const predictionFrames = 20;
        const predicted = this.enemyShip.position.clone();
        const futureMovement = Vector2.multiply(this.enemyShip.velocity, predictionFrames);
        predicted.add(futureMovement);
        return predicted;
    }

    /**
     * Get the difference between two angles (handles wrapping)
     */
    getAngleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    }

    /**
     * Execute the current AI decisions as input commands
     */
    executeActions() {
        // Determine rotation direction
        const angleDiff = this.getAngleDifference(this.ship.angle, this.targetAngle);
        const rotateThreshold = 0.05;

        return {
            rotateLeft: angleDiff < -rotateThreshold,
            rotateRight: angleDiff > rotateThreshold,
            thrust: this.shouldThrust,
            shoot: this.shouldShoot,
            shield: this.shouldShield,
            hyperspace: this.shouldHyperspace
        };
    }

    /**
     * Set AI difficulty
     */
    setDifficulty(level) {
        switch (level) {
            case 'easy':
                this.aimAccuracy = 0.7;
                this.updateInterval = 12;
                this.shootProbability = 0.25;
                this.shootAngleThreshold = 0.3; // Strict aiming
                break;
            case 'medium': // Previous default behavior
                this.aimAccuracy = 0.85;
                this.updateInterval = 8;
                this.shootProbability = 0.5;
                this.shootAngleThreshold = 0.5; // Looser aiming
                break;
            case 'hard':
                this.aimAccuracy = 0.98;
                this.updateInterval = 4;
                this.shootProbability = 0.8;
                this.shootAngleThreshold = 0.8; // Aggressive spray
                break;
        }
    }
}
