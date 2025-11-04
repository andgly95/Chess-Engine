# Chess Game Simulator

A fully functional chess game built with TypeScript that allows you to play chess as both white and black pieces.

## Features

- Complete chess rules implementation
- All standard moves including castling, en passant, and pawn promotion
- Check and checkmate detection
- Turn-based gameplay
- Move history tracking
- Visual board with piece selection and move highlighting

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript code:
   ```bash
   npm run build
   ```

3. Serve the application:
   ```bash
   npm run serve
   ```

4. Open your browser to `http://localhost:8000`

## How to Play

1. Click on a piece to select it
2. Valid moves will be highlighted
3. Click on a highlighted square to move the piece
4. The game alternates between white and black turns
5. The game will notify you of check, checkmate, or stalemate conditions

## Project Structure

```
├── src/
│   ├── types.ts        # Type definitions
│   ├── piece.ts        # Piece classes and movement rules
│   ├── board.ts        # Board state management
│   ├── game.ts         # Game logic and rules
│   ├── ui.ts           # UI controller
│   └── main.ts         # Entry point
├── index.html          # HTML structure
├── styles.css          # Styling
└── package.json        # Project configuration
```
