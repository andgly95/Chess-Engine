// UI Controller for the chess game
import { ChessGame } from './game.js';
import { getPieceSymbol, positionToNotation } from './board.js';
import { ChessAI } from './ai.js';
import { ChessCoach } from './coach.js';
export class ChessUI {
    constructor(game) {
        this.selectedSquare = null;
        this.validMoves = [];
        this.isAIMode = false;
        this.playerColor = 'white';
        this.isAIThinking = false;
        this.isGuideVisible = true;
        this.game = game;
        this.boardElement = document.getElementById('chess-board');
        this.statusElement = document.getElementById('game-status');
        this.historyElement = document.getElementById('move-history');
        this.promotionModal = document.getElementById('promotion-modal');
        this.guideContent = document.getElementById('guide-content');
        this.ai = new ChessAI('medium');
        this.coach = new ChessCoach();
        this.setupEventListeners();
        this.render();
    }
    setupEventListeners() {
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.game = new ChessGame();
                this.selectedSquare = null;
                this.validMoves = [];
                this.render();
                this.checkAIMove();
            });
        }
        // Game mode selector
        const gameModeSelect = document.getElementById('game-mode');
        if (gameModeSelect) {
            gameModeSelect.addEventListener('change', () => {
                this.isAIMode = gameModeSelect.value === 'ai';
                const aiControls = document.getElementById('ai-controls');
                if (aiControls) {
                    aiControls.style.display = this.isAIMode ? 'block' : 'none';
                }
                this.game = new ChessGame();
                this.selectedSquare = null;
                this.validMoves = [];
                this.render();
                this.checkAIMove();
            });
        }
        // AI difficulty selector
        const difficultySelect = document.getElementById('ai-difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                this.ai.setDifficulty(difficultySelect.value);
            });
        }
        // Player color selector
        const colorSelect = document.getElementById('player-color');
        if (colorSelect) {
            colorSelect.addEventListener('change', () => {
                this.playerColor = colorSelect.value;
                this.game = new ChessGame();
                this.selectedSquare = null;
                this.validMoves = [];
                this.render();
                this.checkAIMove();
            });
        }
        // Setup promotion modal listeners
        const promotionPieces = this.promotionModal.querySelectorAll('.promotion-piece');
        promotionPieces.forEach(pieceElement => {
            pieceElement.addEventListener('click', () => {
                const pieceType = pieceElement.getAttribute('data-piece');
                this.handlePromotionChoice(pieceType);
            });
        });
        // Setup guide toggle button
        const toggleGuideBtn = document.getElementById('toggle-guide');
        if (toggleGuideBtn) {
            toggleGuideBtn.addEventListener('click', () => {
                this.isGuideVisible = !this.isGuideVisible;
                if (this.isGuideVisible) {
                    this.guideContent.classList.remove('hidden');
                    toggleGuideBtn.textContent = 'Hide';
                }
                else {
                    this.guideContent.classList.add('hidden');
                    toggleGuideBtn.textContent = 'Show';
                }
            });
        }
    }
    render() {
        this.renderBoard();
        this.renderStatus();
        this.renderMoveHistory();
        this.renderGuide();
        // Check for pending promotion
        if (this.game.hasPendingPromotion()) {
            this.showPromotionModal();
        }
    }
    renderBoard() {
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
                const isValidMove = this.validMoves.some(move => move.row === row && move.col === col);
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
    handleSquareClick(row, col) {
        if (this.game.isGameOver() || this.isAIThinking) {
            return;
        }
        // In AI mode, only allow moves for the player's color
        if (this.isAIMode && this.game.getCurrentTurn() !== this.playerColor) {
            return;
        }
        const clickedPos = { row, col };
        const clickedPiece = this.game.getPiece(clickedPos);
        // If a square is already selected
        if (this.selectedSquare) {
            // Try to make a move
            const isValidMove = this.validMoves.some(move => move.row === row && move.col === col);
            if (isValidMove) {
                const success = this.game.makeMove(this.selectedSquare, clickedPos);
                if (success) {
                    this.selectedSquare = null;
                    this.validMoves = [];
                    this.render();
                    this.checkAIMove();
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
        }
        else {
            // Select a piece if it's the current player's turn
            if (clickedPiece && clickedPiece.color === this.game.getCurrentTurn()) {
                this.selectedSquare = clickedPos;
                this.validMoves = this.game.getValidMovesForPiece(clickedPos);
                this.renderBoard();
            }
        }
    }
    renderStatus() {
        let status = this.game.getGameStatus();
        // Show AI thinking status
        if (this.isAIThinking) {
            status = 'AI is thinking...';
        }
        this.statusElement.textContent = status;
        // Update status styling
        this.statusElement.className = 'game-status';
        const state = this.game.getState();
        if (state.isCheckmate) {
            this.statusElement.classList.add('checkmate');
        }
        else if (state.isCheck) {
            this.statusElement.classList.add('check');
        }
    }
    renderMoveHistory() {
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
    moveToNotation(move) {
        let notation = '';
        if (move.isCastling) {
            notation = move.to.col === 6 ? 'O-O' : 'O-O-O';
        }
        else {
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
        }
        else if (move.isCheck) {
            notation += '+';
        }
        return notation;
    }
    showPromotionModal() {
        const color = this.game.getPendingPromotionColor();
        if (!color)
            return;
        // Update piece symbols in modal based on color
        const pieceSymbols = {
            queen: color === 'white' ? '♕' : '♛',
            rook: color === 'white' ? '♖' : '♜',
            bishop: color === 'white' ? '♗' : '♝',
            knight: color === 'white' ? '♘' : '♞'
        };
        const promotionPieces = this.promotionModal.querySelectorAll('.promotion-piece');
        promotionPieces.forEach(pieceElement => {
            const pieceType = pieceElement.getAttribute('data-piece');
            const symbolElement = pieceElement.querySelector('.piece-symbol');
            if (symbolElement && pieceType) {
                symbolElement.textContent = pieceSymbols[pieceType];
            }
        });
        // Show modal
        this.promotionModal.classList.add('show');
    }
    hidePromotionModal() {
        this.promotionModal.classList.remove('show');
    }
    handlePromotionChoice(pieceType) {
        this.game.completePromotion(pieceType);
        this.hidePromotionModal();
        this.render();
        this.checkAIMove();
    }
    checkAIMove() {
        if (!this.isAIMode || this.game.isGameOver() || this.game.hasPendingPromotion()) {
            return;
        }
        const currentTurn = this.game.getCurrentTurn();
        const aiColor = this.playerColor === 'white' ? 'black' : 'white';
        if (currentTurn === aiColor) {
            this.makeAIMove();
        }
    }
    async makeAIMove() {
        this.isAIThinking = true;
        this.renderStatus();
        // Add a small delay so the user can see the AI is thinking
        await new Promise(resolve => setTimeout(resolve, 500));
        const bestMove = this.ai.findBestMove(this.game);
        if (bestMove) {
            this.game.makeMove(bestMove.from, bestMove.to);
            // If AI has a pending promotion, auto-promote to queen
            if (this.game.hasPendingPromotion()) {
                this.game.completePromotion('queen');
            }
            this.isAIThinking = false;
            this.render();
        }
        else {
            this.isAIThinking = false;
            this.render();
        }
    }
    renderGuide() {
        const moveHistory = this.game.getMoveHistory();
        const analysis = this.coach.analyzePosition(moveHistory);
        // Update opening name
        const openingNameEl = document.querySelector('#opening-name .value');
        if (openingNameEl) {
            openingNameEl.textContent = analysis.openingName;
        }
        // Update opening description
        const openingDescEl = document.getElementById('opening-description');
        if (openingDescEl) {
            openingDescEl.textContent = analysis.openingDescription;
        }
        // Update player opening
        const playerOpeningEl = document.getElementById('player-opening');
        if (playerOpeningEl) {
            playerOpeningEl.textContent = analysis.playerOpening;
        }
        // Update opponent defense
        const opponentDefenseEl = document.getElementById('opponent-defense');
        if (opponentDefenseEl) {
            opponentDefenseEl.textContent = analysis.opponentDefense;
        }
        // Update suggested moves
        const suggestedMovesEl = document.getElementById('suggested-moves');
        if (suggestedMovesEl) {
            suggestedMovesEl.innerHTML = '';
            analysis.suggestedMoves.forEach((move, index) => {
                const moveDiv = document.createElement('div');
                moveDiv.className = 'move-suggestion';
                if (index === 0 && analysis.isInBook) {
                    moveDiv.classList.add('best');
                }
                moveDiv.textContent = move;
                suggestedMovesEl.appendChild(moveDiv);
            });
        }
        // Update strategy tips
        const strategyTipsEl = document.getElementById('strategy-tips');
        if (strategyTipsEl) {
            const ul = strategyTipsEl.querySelector('ul');
            if (ul) {
                ul.innerHTML = '';
                analysis.strategyTips.forEach(tip => {
                    const li = document.createElement('li');
                    li.textContent = tip;
                    ul.appendChild(li);
                });
            }
        }
    }
}
//# sourceMappingURL=ui.js.map