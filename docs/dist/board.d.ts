import { Board, Piece } from './types.js';
export declare function createInitialBoard(): Board;
export declare function copyBoard(board: Board): Board;
export declare function getPieceSymbol(piece: Piece | null): string;
export declare function positionToNotation(row: number, col: number): string;
export declare function notationToPosition(notation: string): {
    row: number;
    col: number;
} | null;
