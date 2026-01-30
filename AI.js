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

        // Difficulty settings
        this.aimAccuracy = 0.9; // 0-1, how accurate the AI aims
        this.reactionTime = 15; // Frames of delay in reactions
        this.shootProbability = 0.3; // Chance to shoot when aimed
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
                shoot: false
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

        // Priority 2: Combat behavior
        this.combatBehavior();
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

        // Shoot if aimed roughly at target
        const currentAngleDiff = this.getAngleDifference(this.ship.angle, angleToTarget);
        this.shouldShoot = Math.abs(currentAngleDiff) < 0.3 && Math.random() < this.shootProbability;
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
            shoot: this.shouldShoot
        };
    }

    /**
     * Set AI difficulty
     */
    setDifficulty(level) {
        switch (level) {
            case 'easy':
                this.aimAccuracy = 0.6;
                this.updateInterval = 15;
                this.shootProbability = 0.2;
                break;
            case 'medium':
                this.aimAccuracy = 0.8;
                this.updateInterval = 10;
                this.shootProbability = 0.3;
                break;
            case 'hard':
                this.aimAccuracy = 0.95;
                this.updateInterval = 5;
                this.shootProbability = 0.4;
                break;
        }
    }
}
