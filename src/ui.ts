// UI Controller for the chess game

import { ChessGame } from './game.js';
import { Position, Move } from './types.js';
import { getPieceSymbol, positionToNotation } from './board.js';
import { findKing } from './piece.js';

export class ChessUI {
  private game: ChessGame;
  private boardElement: HTMLElement;
  private statusElement: HTMLElement;
  private historyElement: HTMLElement;
  private selectedSquare: Position | null = null;
  private validMoves: Position[] = [];

  constructor(game: ChessGame) {
    this.game = game;
    this.boardElement = document.getElementById('chess-board')!;
    this.statusElement = document.getElementById('game-status')!;
    this.historyElement = document.getElementById('move-history')!;

    this.setupEventListeners();
    this.render();
  }

  private setupEventListeners(): void {
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        this.game = new ChessGame();
        this.selectedSquare = null;
        this.validMoves = [];
        this.render();
      });
    }
  }

  render(): void {
    this.renderBoard();
    this.renderStatus();
    this.renderMoveHistory();
  }

  private renderBoard(): void {
    this.boardElement.innerHTML = '';
    const state = this.game.getState();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = 'square';

        // Add light/dark coloring
        const isLight = (row + col) % 2 === 0;
        square.classList.add(isLight ? 'light' : 'dark');

        // Add piece symbol
        const piece = state.board[row][col];
        if (piece) {
          square.textContent = getPieceSymbol(piece);
          square.classList.add('has-piece');
        }

        // Highlight selected square
        if (this.selectedSquare &&
            this.selectedSquare.row === row &&
            this.selectedSquare.col === col) {
          square.classList.add('selected');
        }

        // Highlight valid moves
        const isValidMove = this.validMoves.some(
          move => move.row === row && move.col === col
        );
        if (isValidMove) {
          square.classList.add('valid-move');
          if (piece) {
            square.classList.add('has-piece');
          }
        }

        // Highlight king in check
        if (state.isCheck && piece && piece.type === 'king' && piece.color === state.currentTurn) {
          square.classList.add('in-check');
        }

        // Add click handler
        square.addEventListener('click', () => this.handleSquareClick(row, col));

        this.boardElement.appendChild(square);
      }
    }
  }

  private handleSquareClick(row: number, col: number): void {
    if (this.game.isGameOver()) {
      return;
    }

    const clickedPos: Position = { row, col };
    const clickedPiece = this.game.getPiece(clickedPos);

    // If a square is already selected
    if (this.selectedSquare) {
      // Try to make a move
      const isValidMove = this.validMoves.some(
        move => move.row === row && move.col === col
      );

      if (isValidMove) {
        const success = this.game.makeMove(this.selectedSquare, clickedPos);
        if (success) {
          this.selectedSquare = null;
          this.validMoves = [];
          this.render();
          return;
        }
      }

      // If clicked on own piece, select it instead
      if (clickedPiece && clickedPiece.color === this.game.getCurrentTurn()) {
        this.selectedSquare = clickedPos;
        this.validMoves = this.game.getValidMovesForPiece(clickedPos);
        this.renderBoard();
        return;
      }

      // Otherwise, deselect
      this.selectedSquare = null;
      this.validMoves = [];
      this.renderBoard();
    } else {
      // Select a piece if it's the current player's turn
      if (clickedPiece && clickedPiece.color === this.game.getCurrentTurn()) {
        this.selectedSquare = clickedPos;
        this.validMoves = this.game.getValidMovesForPiece(clickedPos);
        this.renderBoard();
      }
    }
  }

  private renderStatus(): void {
    const status = this.game.getGameStatus();
    this.statusElement.textContent = status;

    // Update status styling
    this.statusElement.className = 'game-status';
    const state = this.game.getState();
    if (state.isCheckmate) {
      this.statusElement.classList.add('checkmate');
    } else if (state.isCheck) {
      this.statusElement.classList.add('check');
    }
  }

  private renderMoveHistory(): void {
    const moves = this.game.getMoveHistory();
    this.historyElement.innerHTML = '';

    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];

      const entry = document.createElement('div');
      entry.className = 'move-entry';

      const numberSpan = document.createElement('span');
      numberSpan.className = 'move-number';
      numberSpan.textContent = `${moveNumber}.`;

      const notationSpan = document.createElement('span');
      notationSpan.className = 'move-notation';

      let notation = this.moveToNotation(whiteMove);
      if (blackMove) {
        notation += ' ' + this.moveToNotation(blackMove);
      }

      notationSpan.textContent = notation;

      entry.appendChild(numberSpan);
      entry.appendChild(notationSpan);
      this.historyElement.appendChild(entry);
    }

    // Scroll to bottom
    this.historyElement.scrollTop = this.historyElement.scrollHeight;
  }

  private moveToNotation(move: Move): string {
    let notation = '';

    if (move.isCastling) {
      notation = move.to.col === 6 ? 'O-O' : 'O-O-O';
    } else {
      // Piece symbol (except for pawns)
      if (move.piece !== 'pawn') {
        notation += move.piece[0].toUpperCase();
      }

      // Capture notation
      if (move.captured || move.isEnPassant) {
        if (move.piece === 'pawn') {
          notation += positionToNotation(move.from.row, move.from.col)[0];
        }
        notation += 'x';
      }

      // Destination square
      notation += positionToNotation(move.to.row, move.to.col);

      // Promotion
      if (move.promotionTo) {
        notation += '=' + move.promotionTo[0].toUpperCase();
      }
    }

    // Check/Checkmate
    if (move.isCheckmate) {
      notation += '#';
    } else if (move.isCheck) {
      notation += '+';
    }

    return notation;
  }
}
