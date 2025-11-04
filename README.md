# Chess Game Simulator with AI Coach

A fully functional chess game built with TypeScript with an integrated AI coach powered by Claude AI.

## ✨ Features

### Game Features
- Complete chess rules implementation
- All standard moves including castling, en passant, and pawn promotion
- Pawn promotion piece selection (Queen, Rook, Bishop, Knight)
- Check and checkmate detection
- Turn-based gameplay (Player vs Player or Player vs AI)
- AI opponent with 3 difficulty levels (Easy, Medium, Hard)
- Move history tracking with algebraic notation
- Visual board with piece selection and move highlighting

### 🎓 Chess Coach Features
- **Opening Detection**: Recognizes 12+ popular chess openings
- **Real-time Analysis**: Shows opening name, description, and variations
- **Move Suggestions**: Provides best continuation moves
- **Strategy Tips**: Phase-based strategic guidance
- **Claude AI Integration**: Explains every move with tactical and strategic analysis
- **Live Updates**: Coach panel updates after each move

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

## 🤖 Claude AI Coach Setup

**Important**: The Claude AI features require deployment to Netlify or Vercel due to CORS restrictions.

### Quick Deploy to Netlify (Recommended):

1. **Fork/Clone this repository**
2. **Go to [Netlify](https://netlify.com)**
3. **Click "Add new site" → "Import an existing project"**
4. **Select your repository**
5. **Deploy!**

Your chess coach will be live at `https://your-site.netlify.app` ✅

**See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.**

### Get Your Claude API Key:

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account and generate an API key
3. In the deployed app, scroll to "⚙️ AI Settings"
4. Paste your API key and click Save
5. Start playing to see AI move analysis!

## Project Structure

```
├── src/
│   ├── types.ts        # Type definitions
│   ├── piece.ts        # Piece movement rules
│   ├── board.ts        # Board state management
│   ├── game.ts         # Game logic and rules
│   ├── ai.ts           # AI opponent (Minimax algorithm)
│   ├── coach.ts        # Chess coach (opening database)
│   ├── claudeAPI.ts    # Claude AI integration
│   ├── ui.ts           # UI controller
│   └── main.ts         # Entry point
├── netlify/
│   └── functions/      # Serverless functions for API proxy
├── index.html          # HTML structure
├── styles.css          # Styling
├── netlify.toml        # Netlify configuration
└── package.json        # Project configuration
```

## Technologies

- **TypeScript**: Type-safe chess logic
- **Claude AI**: Move analysis and coaching
- **Minimax Algorithm**: AI opponent with alpha-beta pruning
- **Netlify Functions**: Serverless API proxy
- **HTML/CSS/JavaScript**: Modern web interface
