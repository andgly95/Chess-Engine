import { Board, Move, Color } from './types.js';
export interface ClaudeConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
}
export interface ClaudeAnalysisResponse {
    moveExplanation: string;
    tacticalAnalysis: string;
    strategicPlan: string;
    error?: string;
}
export declare class ClaudeAPI {
    private config;
    private readonly API_URL;
    private readonly DEFAULT_MODEL;
    private readonly DEFAULT_MAX_TOKENS;
    constructor();
    /**
     * Set the API configuration
     */
    setConfig(apiKey: string, model?: string, maxTokens?: number): void;
    /**
     * Check if API is configured
     */
    isConfigured(): boolean;
    /**
     * Get API key (first 10 chars for display)
     */
    getApiKeyPreview(): string;
    /**
     * Clear API configuration
     */
    clearConfig(): void;
    /**
     * Save config to localStorage
     */
    private saveConfig;
    /**
     * Load config from localStorage
     */
    private loadConfig;
    /**
     * Analyze the last move made
     */
    analyzeMove(lastMove: Move, moveHistory: Move[], boardState: Board, currentTurn: Color): Promise<ClaudeAnalysisResponse>;
    /**
     * Build prompt for move analysis
     */
    private buildMoveAnalysisPrompt;
    /**
     * Call Claude API
     */
    private callClaudeAPI;
    /**
     * Parse Claude's response
     */
    private parseMoveAnalysis;
    /**
     * Convert board to FEN notation
     */
    private boardToFEN;
    /**
     * Convert piece to FEN symbol
     */
    private pieceToFEN;
    /**
     * Convert move to algebraic notation
     */
    private moveToAlgebraic;
    /**
     * Convert move history to PGN format
     */
    private movesToPGN;
}
