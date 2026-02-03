/**
 * SoundManager.js
 * Handles game audio and sound effects
 */

class SoundManager {
    constructor() {
        this.enabled = true; // Sound effects enabled
        this.musicEnabled = true; // Music enabled
        this.sounds = {};
        this.music = null;
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
     * Load music file
     */
    loadMusic(path) {
        this.music = new Audio(path);
        this.music.volume = this.volume;
        this.music.loop = true;
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
     * Play background music
     */
    playMusic() {
        if (!this.musicEnabled || !this.music) return;

        // Only play if currently paused to avoid errors/interruptions
        if (this.music.paused) {
            this.music.play().catch(err => {
                console.log('Music play prevented:', err.message);
            });
        }
    }

    /**
     * Check if music is paused
     */
    isMusicPaused() {
        return this.music && this.music.paused;
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    /**
     * Toggle sound effects on/off
     */
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Toggle music on/off
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    /**
     * Check if sounds are enabled
     */
    isSoundEnabled() {
        return this.enabled;
    }

    /**
     * Check if music is enabled
     */
    isMusicEnabled() {
        return this.musicEnabled;
    }
}
