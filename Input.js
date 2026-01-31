/**
 * Input.js
 * Keyboard input handling system
 */

class Input {
    constructor() {
        this.keys = {};

        // Bind event listeners
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    /**
     * Handle key down event
     */
    onKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        this.keys[event.code] = true; // Also store by code for special keys
    }

    /**
     * Handle key up event
     */
    onKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
        this.keys[event.code] = false;
    }

    /**
     * Check if a key is currently pressed
     */
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || this.keys[key] || false;
    }

    /**
     * Get input state for Ship 1 (WASD controls)
     */
    getShip1Input() {
        return {
            rotateLeft: this.isKeyPressed('ArrowLeft'),
            rotateRight: this.isKeyPressed('ArrowRight'),
            thrust: this.isKeyPressed('ArrowUp'),
            shoot: this.isKeyPressed('ControlRight') || this.isKeyPressed('Control')
        };
    }

    /**
     * Get input state for Ship 2 (Arrow keys)
     */
    getShip2Input() {
        return {
            rotateLeft: this.isKeyPressed('a'),
            rotateRight: this.isKeyPressed('d'),
            thrust: this.isKeyPressed('w'),
            shoot: this.isKeyPressed('v')
        };
    }
}
