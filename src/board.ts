// Board state management

import { Board, Piece, PieceType, Color } from './types.js';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
  }

  // Place other pieces
  const backRowPieces: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRowPieces[col], color: 'black', hasMoved: false };
    board[7][col] = { type: backRowPieces[col], color: 'white', hasMoved: false };
  }

  return board;
}

export function copyBoard(board: Board): Board {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

export function getPieceSymbol(piece: Piece | null): string {
  if (!piece) return '';

  const symbols: Record<Color, Record<PieceType, string>> = {
    white: {
      pawn: '♙',
      knight: '♘',
      bishop: '♗',
      rook: '♖',
      queen: '♕',
      king: '♔'
    },
    black: {
      pawn: '♟',
      knight: '♞',
      bishop: '♝',
      rook: '♜',
      queen: '♛',
      king: '♚'
    }
  };

  return symbols[piece.color][piece.type];
}

export function positionToNotation(row: number, col: number): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rank = 8 - row;
  return `${files[col]}${rank}`;
}

export function notationToPosition(notation: string): { row: number; col: number } | null {
  if (notation.length !== 2) return null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const col = files.indexOf(notation[0]);
  const rank = parseInt(notation[1]);

  if (col === -1 || rank < 1 || rank > 8) return null;

  const row = 8 - rank;
  return { row, col };
}
