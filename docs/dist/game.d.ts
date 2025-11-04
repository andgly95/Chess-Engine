import { Color, GameState, Move, Position, Piece } from './types.js';
export declare class ChessGame {
    private state;
    constructor();
    getState(): GameState;
    getCurrentTurn(): Color;
    getPiece(pos: Position): Piece | null;
    getValidMovesForPiece(pos: Position): Position[];
    private getEnPassantMoves;
    makeMove(from: Position, to: Position): boolean;
    private updateGameState;
    private hasAnyValidMoves;
    isGameOver(): boolean;
    getMoveHistory(): Move[];
    getGameStatus(): string;
}
