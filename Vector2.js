/**
 * Vector2.js
 * 2D vector class for physics calculations
 */

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Add another vector to this vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Subtract another vector from this vector
     */
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Multiply this vector by a scalar
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide this vector by a scalar
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Get the magnitude (length) of this vector
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Get the squared magnitude (avoids sqrt for performance)
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize this vector (make it unit length)
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Get the distance to another vector
     */
    distanceTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get the squared distance to another vector
     */
    distanceToSquared(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return dx * dx + dy * dy;
    }

    /**
     * Create a copy of this vector
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Copy values from another vector
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Set the x and y values
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Static method to create a vector from an angle
     */
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Static method to subtract two vectors
     */
    static subtract(v1, v2) {
        return new Vector2(v1.x - v2.x, v1.y - v2.y);
    }

    /**
     * Static method to add two vectors
     */
    static add(v1, v2) {
        return new Vector2(v1.x + v2.x, v1.y + v2.y);
    }

    /**
     * Static method to multiply a vector by a scalar
     */
    static multiply(v, scalar) {
        return new Vector2(v.x * scalar, v.y * scalar);
    }
}
