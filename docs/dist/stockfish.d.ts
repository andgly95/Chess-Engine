import { Board, Color, Move } from './types.js';
export interface StockfishMove {
    move: string;
    score: number;
    mate?: number;
    pv?: string[];
}
export interface StockfishAnalysis {
    bestMoves: StockfishMove[];
    evaluation: number;
    depth: number;
}
export declare class StockfishEngine {
    private engine;
    private initialized;
    private ready;
    private pendingCommands;
    private messageBuffer;
    constructor();
    /**
     * Initialize Stockfish engine worker
     */
    private initEngine;
    /**
     * Handle messages from Stockfish engine
     */
    private handleEngineMessage;
    /**
     * Send command to Stockfish and wait for response
     */
    private sendCommand;
    /**
     * Wait for engine to be ready
     */
    private waitForReady;
    /**
     * Analyze a position and get top moves
     */
    analyzePosition(fen: string, depth?: number, timeMs?: number): Promise<StockfishAnalysis>;
    /**
     * Parse Stockfish analysis output
     */
    private parseAnalysis;
    /**
     * Convert board state to FEN notation
     */
    boardToFEN(board: Board, currentTurn: Color, moveHistory?: Move[]): string;
    /**
     * Convert piece to FEN symbol
     */
    private pieceToFEN;
    /**
     * Convert UCI move to human-readable format
     */
    uciToAlgebraic(uciMove: string, board: Board): string;
    /**
     * Get evaluation as human-readable string
     */
    formatEvaluation(score: number, mate?: number): string;
    /**
     * Terminate the engine
     */
    terminate(): void;
}
