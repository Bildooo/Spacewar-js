/**
 * SoundManager.js
 * Handles game audio and sound effects
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.volume = 0.3; // Master volume (0-1)
    }

    /**
     * Load a sound file
     */
    loadSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }

    /**
     * Play a sound effect
     */
    play(name) {
        if (!this.enabled || !this.sounds[name]) return;

        // Clone the audio to allow overlapping sounds
        const sound = this.sounds[name].cloneNode();
        sound.volume = this.volume;
        sound.play().catch(err => {
            // Ignore play errors (can happen if user hasn't interacted yet)
            console.log('Audio play prevented:', err.message);
        });
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set sound enabled state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if sounds are enabled
     */
    isEnabled() {
        return this.enabled;
    }
}
