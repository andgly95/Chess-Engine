// Type definitions for the chess game

export type Color = 'white' | 'black';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: PieceType;
  color: Color;
  captured?: PieceType;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  promotionTo?: PieceType;
}

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  currentTurn: Color;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  winner?: Color;
}
