// Game logic and state management

import { Board, Color, GameState, Move, Position, Piece } from './types.js';
import { createInitialBoard, copyBoard } from './board.js';
import { getValidMoves, isKingInCheck, canCastle, wouldMoveResultInCheck } from './piece.js';

export class ChessGame {
  private state: GameState;
  private pendingPromotion: { position: Position; move: Partial<Move> } | null = null;

  constructor() {
    this.state = {
      board: createInitialBoard(),
      currentTurn: 'white',
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      isStalemate: false
    };
  }

  getState(): GameState {
    return {
      ...this.state,
      board: copyBoard(this.state.board)
    };
  }

  getCurrentTurn(): Color {
    return this.state.currentTurn;
  }

  getPiece(pos: Position): Piece | null {
    return this.state.board[pos.row][pos.col];
  }

  getValidMovesForPiece(pos: Position): Position[] {
    const piece = this.getPiece(pos);
    if (!piece || piece.color !== this.state.currentTurn) {
      return [];
    }

    let moves = getValidMoves(this.state.board, pos, true);

    // Add castling moves for king
    if (piece.type === 'king' && !piece.hasMoved) {
      if (canCastle(this.state.board, piece.color, 'kingside')) {
        moves.push({ row: pos.row, col: 6 });
      }
      if (canCastle(this.state.board, piece.color, 'queenside')) {
        moves.push({ row: pos.row, col: 2 });
      }
    }

    // Add en passant for pawns
    if (piece.type === 'pawn') {
      const enPassantMoves = this.getEnPassantMoves(pos);
      moves.push(...enPassantMoves);
    }

    return moves;
  }

  private getEnPassantMoves(pos: Position): Position[] {
    const moves: Position[] = [];
    const piece = this.state.board[pos.row][pos.col];
    if (!piece || piece.type !== 'pawn') return moves;

    const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];
    if (!lastMove || lastMove.piece !== 'pawn') return moves;

    // Check if last move was a two-square pawn advance
    const rowDiff = Math.abs(lastMove.to.row - lastMove.from.row);
    if (rowDiff !== 2) return moves;

    // Check if the pawn is adjacent
    if (lastMove.to.row !== pos.row) return moves;
    const colDiff = Math.abs(lastMove.to.col - pos.col);
    if (colDiff !== 1) return moves;

    // En passant is valid
    const direction = piece.color === 'white' ? -1 : 1;
    const enPassantPos = { row: pos.row + direction, col: lastMove.to.col };
    moves.push(enPassantPos);

    return moves;
  }

  makeMove(from: Position, to: Position): boolean {
    const piece = this.getPiece(from);
    if (!piece || piece.color !== this.state.currentTurn) {
      return false;
    }

    const validMoves = this.getValidMovesForPiece(from);
    const isValidMove = validMoves.some(move => move.row === to.row && move.col === to.col);

    if (!isValidMove) {
      return false;
    }

    // Check for castling
    const isCastling = piece.type === 'king' && Math.abs(to.col - from.col) === 2;

    // Check for en passant
    const isEnPassant = piece.type === 'pawn' &&
                        to.col !== from.col &&
                        !this.state.board[to.row][to.col];

    // Capture the piece at destination (if any)
    const capturedPiece = this.state.board[to.row][to.col];

    // Move the piece
    this.state.board[to.row][to.col] = piece;
    this.state.board[from.row][from.col] = null;
    piece.hasMoved = true;

    // Handle castling - move the rook
    if (isCastling) {
      const isKingside = to.col > from.col;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? 5 : 3;
      const rook = this.state.board[from.row][rookFromCol];
      if (rook) {
        this.state.board[from.row][rookToCol] = rook;
        this.state.board[from.row][rookFromCol] = null;
        rook.hasMoved = true;
      }
    }

    // Handle en passant - remove captured pawn
    if (isEnPassant) {
      this.state.board[from.row][to.col] = null;
    }

    // Handle pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      // Store pending promotion and wait for user choice
      this.pendingPromotion = {
        position: to,
        move: {
          from,
          to,
          piece: 'pawn',
          color: piece.color,
          captured: capturedPiece?.type,
          isCastling,
          isEnPassant
        }
      };
      return true; // Move is valid, but promotion is pending
    }

    // Record the move
    const move: Move = {
      from,
      to,
      piece: piece.type,
      color: piece.color,
      captured: capturedPiece?.type,
      isCastling,
      isEnPassant
    };

    this.state.moveHistory.push(move);

    // Switch turns
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';

    // Check game state
    this.updateGameState();

    return true;
  }

  private updateGameState(): void {
    const currentColor = this.state.currentTurn;

    // Check if current player is in check
    this.state.isCheck = isKingInCheck(this.state.board, currentColor);

    // Check for checkmate or stalemate
    const hasValidMoves = this.hasAnyValidMoves(currentColor);

    if (!hasValidMoves) {
      if (this.state.isCheck) {
        this.state.isCheckmate = true;
        this.state.winner = currentColor === 'white' ? 'black' : 'white';
      } else {
        this.state.isStalemate = true;
      }
    }

    // Update the last move with check/checkmate info
    if (this.state.moveHistory.length > 0) {
      const lastMove = this.state.moveHistory[this.state.moveHistory.length - 1];
      lastMove.isCheck = this.state.isCheck;
      lastMove.isCheckmate = this.state.isCheckmate;
    }
  }

  private hasAnyValidMoves(color: Color): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.state.board[row][col];
        if (piece && piece.color === color) {
          const moves = this.getValidMovesForPiece({ row, col });
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isGameOver(): boolean {
    return this.state.isCheckmate || this.state.isStalemate;
  }

  getMoveHistory(): Move[] {
    return [...this.state.moveHistory];
  }

  getGameStatus(): string {
    if (this.state.isCheckmate) {
      return `Checkmate! ${this.state.winner} wins!`;
    }
    if (this.state.isStalemate) {
      return 'Stalemate! The game is a draw.';
    }
    if (this.state.isCheck) {
      return `${this.state.currentTurn} is in check!`;
    }
    return `${this.state.currentTurn}'s turn`;
  }

  hasPendingPromotion(): boolean {
    return this.pendingPromotion !== null;
  }

  getPendingPromotionColor(): Color | null {
    return this.pendingPromotion?.move.color || null;
  }

  completePromotion(pieceType: 'queen' | 'rook' | 'bishop' | 'knight'): void {
    if (!this.pendingPromotion) {
      return;
    }

    const { position, move } = this.pendingPromotion;
    const piece = this.state.board[position.row][position.col];

    if (!piece || piece.type !== 'pawn') {
      this.pendingPromotion = null;
      return;
    }

    // Promote the pawn
    piece.type = pieceType;

    // Record the complete move
    const completeMove: Move = {
      from: move.from!,
      to: move.to!,
      piece: pieceType,
      color: move.color!,
      captured: move.captured,
      isCastling: move.isCastling || false,
      isEnPassant: move.isEnPassant || false,
      promotionTo: pieceType
    };

    this.state.moveHistory.push(completeMove);

    // Clear pending promotion
    this.pendingPromotion = null;

    // Switch turns
    this.state.currentTurn = this.state.currentTurn === 'white' ? 'black' : 'white';

    // Check game state
    this.updateGameState();
  }
}
