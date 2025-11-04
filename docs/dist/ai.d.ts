import { Position } from './types.js';
import { ChessGame } from './game.js';
export type Difficulty = 'easy' | 'medium' | 'hard';
export declare class ChessAI {
    private difficulty;
    private maxDepth;
    constructor(difficulty?: Difficulty);
    private getDepthForDifficulty;
    setDifficulty(difficulty: Difficulty): void;
    private readonly pieceValues;
    private readonly pawnTable;
    private readonly knightTable;
    private readonly bishopTable;
    private readonly rookTable;
    private readonly kingTable;
    /**
     * Find the best move for the AI
     */
    findBestMove(game: ChessGame): {
        from: Position;
        to: Position;
    } | null;
    /**
     * Minimax algorithm with alpha-beta pruning
     */
    private minimax;
    /**
     * Evaluate the board position
     */
    private evaluateBoard;
    /**
     * Get position bonus for piece placement
     */
    private getPositionBonus;
    /**
     * Get all possible moves from the current game state
     */
    private getAllPossibleMoves;
    /**
     * Get all possible moves from a board state (without game object)
     */
    private getAllPossibleMovesFromBoard;
    /**
     * Make a test move on a board (for evaluation purposes)
     */
    private makeTestMove;
}
