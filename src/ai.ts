// AI opponent using Minimax algorithm with alpha-beta pruning

import { Board, Color, Position, PieceType, Piece } from './types.js';
import { ChessGame } from './game.js';
import { getValidMoves, isKingInCheck } from './piece.js';
import { copyBoard } from './board.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface ScoredMove {
  from: Position;
  to: Position;
  score: number;
}

export class ChessAI {
  private difficulty: Difficulty;
  private maxDepth: number;

  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty;
    this.maxDepth = this.getDepthForDifficulty(difficulty);
  }

  private getDepthForDifficulty(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 3;
      case 'hard': return 4;
    }
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.maxDepth = this.getDepthForDifficulty(difficulty);
  }

  // Piece values for evaluation
  private readonly pieceValues: Record<PieceType, number> = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000
  };

  // Position bonuses for better piece placement
  private readonly pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];

  private readonly knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];

  private readonly bishopTable = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ];

  private readonly rookTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ];

  private readonly kingTable = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ];

  /**
   * Find the best move for the AI
   */
  findBestMove(game: ChessGame): { from: Position; to: Position } | null {
    const state = game.getState();
    const board = state.board;
    const color = state.currentTurn;

    let bestMove: { from: Position; to: Position } | null = null;
    let bestScore = -Infinity;

    // Get all possible moves
    const allMoves = this.getAllPossibleMoves(game, board, color);

    // Add some randomness for easy difficulty
    if (this.difficulty === 'easy' && Math.random() < 0.3) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    // Evaluate each move
    for (const move of allMoves) {
      const testBoard = copyBoard(board);
      this.makeTestMove(testBoard, move.from, move.to);

      const score = -this.minimax(testBoard, this.maxDepth - 1, -Infinity, Infinity, color === 'white' ? 'black' : 'white', color);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    currentPlayer: Color,
    aiColor: Color
  ): number {
    if (depth === 0) {
      return this.evaluateBoard(board, aiColor);
    }

    const moves = this.getAllPossibleMovesFromBoard(board, currentPlayer);

    if (moves.length === 0) {
      // Check for checkmate or stalemate
      if (isKingInCheck(board, currentPlayer)) {
        // Checkmate - very bad if it's our turn, very good if it's opponent's turn
        return currentPlayer === aiColor ? -100000 : 100000;
      }
      // Stalemate
      return 0;
    }

    if (currentPlayer === aiColor) {
      // Maximizing player
      let maxScore = -Infinity;
      for (const move of moves) {
        const testBoard = copyBoard(board);
        this.makeTestMove(testBoard, move.from, move.to);
        const score = this.minimax(testBoard, depth - 1, alpha, beta, currentPlayer === 'white' ? 'black' : 'white', aiColor);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }
      return maxScore;
    } else {
      // Minimizing player
      let minScore = Infinity;
      for (const move of moves) {
        const testBoard = copyBoard(board);
        this.makeTestMove(testBoard, move.from, move.to);
        const score = this.minimax(testBoard, depth - 1, alpha, beta, currentPlayer === 'white' ? 'black' : 'white', aiColor);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }
      return minScore;
    }
  }

  /**
   * Evaluate the board position
   */
  private evaluateBoard(board: Board, aiColor: Color): number {
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const pieceValue = this.pieceValues[piece.type];
        const positionBonus = this.getPositionBonus(piece, row, col);

        const totalValue = pieceValue + positionBonus;

        if (piece.color === aiColor) {
          score += totalValue;
        } else {
          score -= totalValue;
        }
      }
    }

    return score;
  }

  /**
   * Get position bonus for piece placement
   */
  private getPositionBonus(piece: Piece, row: number, col: number): number {
    // Flip the row for black pieces
    const evalRow = piece.color === 'white' ? row : 7 - row;

    switch (piece.type) {
      case 'pawn':
        return this.pawnTable[evalRow][col];
      case 'knight':
        return this.knightTable[evalRow][col];
      case 'bishop':
        return this.bishopTable[evalRow][col];
      case 'rook':
        return this.rookTable[evalRow][col];
      case 'king':
        return this.kingTable[evalRow][col];
      case 'queen':
        return 0; // Queen doesn't have specific position bonus
    }
  }

  /**
   * Get all possible moves from the current game state
   */
  private getAllPossibleMoves(game: ChessGame, board: Board, color: Color): { from: Position; to: Position }[] {
    const moves: { from: Position; to: Position }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const from = { row, col };
          const validMoves = game.getValidMovesForPiece(from);

          for (const to of validMoves) {
            moves.push({ from, to });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Get all possible moves from a board state (without game object)
   */
  private getAllPossibleMovesFromBoard(board: Board, color: Color): { from: Position; to: Position }[] {
    const moves: { from: Position; to: Position }[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          const from = { row, col };
          const validMoves = getValidMoves(board, from, true);

          for (const to of validMoves) {
            moves.push({ from, to });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Make a test move on a board (for evaluation purposes)
   */
  private makeTestMove(board: Board, from: Position, to: Position): void {
    const piece = board[from.row][from.col];
    if (!piece) return;

    board[to.row][to.col] = piece;
    board[from.row][from.col] = null;

    // Handle pawn promotion (auto-promote to queen for AI)
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      piece.type = 'queen';
    }
  }
}
