/**
 * main.js
 * Entry point for the Spacewar! game
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Create and start the game
    const game = new Game('gameCanvas');
    game.start();

    console.log('Spacewar! started');
    console.log('Player 1: W=Thrust, A/D=Rotate, S=Shoot');
    console.log('Player 2: ↑=Thrust, ←/→=Rotate, RCtrl=Shoot');
});
