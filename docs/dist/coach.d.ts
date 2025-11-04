import { Move, Color, Board } from './types.js';
import { ClaudeAPI, ClaudeAnalysisResponse } from './claudeAPI.js';
export interface OpeningInfo {
    name: string;
    moves: string[];
    description: string;
    category: string;
    nextMoves?: string[];
    tips?: string[];
}
export interface CoachAnalysis {
    openingName: string;
    openingDescription: string;
    playerOpening: string;
    opponentDefense: string;
    suggestedMoves: string[];
    strategyTips: string[];
    isInBook: boolean;
}
export declare class ChessCoach {
    private claudeAPI;
    private openingsDatabase;
    constructor();
    /**
     * Get Claude API instance for configuration
     */
    getClaudeAPI(): ClaudeAPI;
    /**
     * Analyze the current game state and provide coaching guidance
     */
    analyzePosition(moveHistory: Move[]): CoachAnalysis;
    /**
     * Convert move history to algebraic notation for matching
     */
    private convertMovesToNotation;
    /**
     * Detect which opening is being played
     */
    private detectOpening;
    /**
     * Check if move sequence matches an opening
     */
    private matchesOpening;
    /**
     * Get the type of opening a player is using
     */
    private getPlayerOpeningType;
    /**
     * Get starting guidance before any moves
     */
    private getStartingGuidance;
    /**
     * Get general move suggestions when out of book
     */
    private getGeneralSuggestions;
    /**
     * Get general strategy tips based on game phase
     */
    private getGeneralTips;
    /**
     * Get Claude AI analysis of the last move
     */
    analyzeLastMove(lastMove: Move, moveHistory: Move[], boardState: Board, currentTurn: Color): Promise<ClaudeAnalysisResponse>;
}
