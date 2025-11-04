// Main entry point for the chess game
import { ChessGame } from './game.js';
import { ChessUI } from './ui.js';
// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new ChessGame();
    const ui = new ChessUI(game);
    console.log('Chess game initialized!');
    console.log('Click on a piece to select it, then click on a highlighted square to move.');
});
//# sourceMappingURL=main.js.map