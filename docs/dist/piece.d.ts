import { Board, Color, Position } from './types.js';
export declare function getValidMoves(board: Board, position: Position, checkForCheck?: boolean): Position[];
export declare function isValidPosition(pos: Position): boolean;
export declare function wouldMoveResultInCheck(board: Board, from: Position, to: Position, color: Color): boolean;
export declare function isKingInCheck(board: Board, color: Color): boolean;
export declare function findKing(board: Board, color: Color): Position | null;
export declare function canCastle(board: Board, color: Color, side: 'kingside' | 'queenside'): boolean;
