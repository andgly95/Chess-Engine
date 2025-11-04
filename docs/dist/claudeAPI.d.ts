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
    suggestedMoves: string[];
    strategyTips: string[];
    error?: string;
}
export declare class ClaudeAPI {
    private config;
    private readonly API_URL;
    private readonly DEFAULT_MODEL;
    private readonly DEFAULT_MAX_TOKENS;
    private responseCache;
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
     * Load response cache from localStorage
     */
    private loadCache;
    /**
     * Save response cache to localStorage
     */
    private saveCache;
    /**
     * Generate cache key from move history
     */
    private getCacheKey;
    /**
     * Analyze the last move made
     */
    analyzeMove(lastMove: Move, moveHistory: Move[], boardState: Board, currentTurn: Color): Promise<ClaudeAnalysisResponse>;
    /**
     * Build prompt for move analysis
     */
    private buildMoveAnalysisPrompt;
    /**
     * Get tool definition for structured output
     */
    private getAnalysisTool;
    /**
     * Call Claude API through proxy
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
