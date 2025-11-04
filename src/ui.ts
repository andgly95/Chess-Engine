// UI Controller for the chess game

import { ChessGame } from './game.js';
import { Position, Move, Color } from './types.js';
import { getPieceSymbol, positionToNotation } from './board.js';
import { findKing } from './piece.js';
import { ChessAI, Difficulty } from './ai.js';
import { ChessCoach } from './coach.js';

interface MoveAnalysisEntry {
  moveNumber: number;
  moveNotation: string;
  explanation: string;
  tacticalAnalysis?: string;
  strategicPlan?: string;
  suggestedMoves?: string[];
  strategyTips?: string[];
}

export class ChessUI {
  private game: ChessGame;
  private boardElement: HTMLElement;
  private statusElement: HTMLElement;
  private historyElement: HTMLElement;
  private promotionModal: HTMLElement;
  private guideContent: HTMLElement;
  private selectedSquare: Position | null = null;
  private validMoves: Position[] = [];
  private ai: ChessAI;
  private coach: ChessCoach;
  private isAIMode: boolean = false;
  private playerColor: Color = 'white';
  private isAIThinking: boolean = false;
  private isGuideVisible: boolean = true;
  private moveAnalyses: MoveAnalysisEntry[] = [];
  private currentAnalysisIndex: number = -1;

  constructor(game: ChessGame) {
    this.game = game;
    this.boardElement = document.getElementById('chess-board')!;
    this.statusElement = document.getElementById('game-status')!;
    this.historyElement = document.getElementById('move-history')!;
    this.promotionModal = document.getElementById('promotion-modal')!;
    this.guideContent = document.getElementById('guide-content')!;
    this.ai = new ChessAI('medium');
    this.coach = new ChessCoach();

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
        this.moveAnalyses = [];
        this.currentAnalysisIndex = -1;
        this.render();
        this.checkAIMove();
      });
    }

    // Game mode selector
    const gameModeSelect = document.getElementById('game-mode') as HTMLSelectElement;
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
        this.moveAnalyses = [];
        this.currentAnalysisIndex = -1;
        this.render();
        this.checkAIMove();
      });
    }

    // AI difficulty selector
    const difficultySelect = document.getElementById('ai-difficulty') as HTMLSelectElement;
    if (difficultySelect) {
      difficultySelect.addEventListener('change', () => {
        this.ai.setDifficulty(difficultySelect.value as Difficulty);
      });
    }

    // Player color selector
    const colorSelect = document.getElementById('player-color') as HTMLSelectElement;
    if (colorSelect) {
      colorSelect.addEventListener('change', () => {
        this.playerColor = colorSelect.value as Color;
        this.game = new ChessGame();
        this.selectedSquare = null;
        this.validMoves = [];
        this.moveAnalyses = [];
        this.currentAnalysisIndex = -1;
        this.render();
        this.checkAIMove();
      });
    }

    // Setup promotion modal listeners
    const promotionPieces = this.promotionModal.querySelectorAll('.promotion-piece');
    promotionPieces.forEach(pieceElement => {
      pieceElement.addEventListener('click', () => {
        const pieceType = pieceElement.getAttribute('data-piece') as 'queen' | 'rook' | 'bishop' | 'knight';
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
        } else {
          this.guideContent.classList.add('hidden');
          toggleGuideBtn.textContent = 'Show';
        }
      });
    }

    // Setup API key save button
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
    const apiStatus = document.getElementById('api-status');

    console.log('Setting up API key button...', { saveApiKeyBtn, apiKeyInput, apiStatus });

    if (saveApiKeyBtn && apiKeyInput && apiStatus) {
      saveApiKeyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Save API key button clicked!');

        const apiKey = apiKeyInput.value.trim();
        console.log('API Key length:', apiKey.length);

        if (apiKey) {
          this.coach.getClaudeAPI().setConfig(apiKey);
          const statusText = apiStatus.querySelector('.status-text');
          if (statusText) {
            statusText.textContent = `✓ API Key saved: ${this.coach.getClaudeAPI().getApiKeyPreview()}`;
            statusText.className = 'status-text success';
          }
          apiKeyInput.value = '';
          apiKeyInput.placeholder = 'API Key saved successfully!';

          // Visual feedback
          saveApiKeyBtn.textContent = 'Saved!';
          setTimeout(() => {
            saveApiKeyBtn.textContent = 'Save';
          }, 2000);

          console.log('API key saved successfully!');
        } else {
          const statusText = apiStatus.querySelector('.status-text');
          if (statusText) {
            statusText.textContent = 'Please enter an API key';
            statusText.className = 'status-text error';
          }
        }
      });

      // Load existing API key status
      this.updateApiKeyStatus();
    } else {
      console.error('Could not find API key elements:', { saveApiKeyBtn, apiKeyInput, apiStatus });
    }

    // Setup analysis navigation buttons
    const prevAnalysisBtn = document.getElementById('prev-analysis');
    const nextAnalysisBtn = document.getElementById('next-analysis');

    if (prevAnalysisBtn) {
      prevAnalysisBtn.addEventListener('click', () => {
        this.navigateAnalysis(-1);
      });
    }

    if (nextAnalysisBtn) {
      nextAnalysisBtn.addEventListener('click', () => {
        this.navigateAnalysis(1);
      });
    }
  }

  private updateApiKeyStatus(): void {
    const apiStatus = document.getElementById('api-status');
    const claudeAPI = this.coach.getClaudeAPI();

    if (apiStatus && claudeAPI.isConfigured()) {
      const statusText = apiStatus.querySelector('.status-text');
      if (statusText) {
        statusText.textContent = `✓ API Key configured: ${claudeAPI.getApiKeyPreview()}`;
        statusText.className = 'status-text success';
      }
    }
  }

  private navigateAnalysis(direction: number): void {
    if (this.moveAnalyses.length === 0) return;

    this.currentAnalysisIndex += direction;

    // Clamp to valid range
    if (this.currentAnalysisIndex < 0) {
      this.currentAnalysisIndex = 0;
    } else if (this.currentAnalysisIndex >= this.moveAnalyses.length) {
      this.currentAnalysisIndex = this.moveAnalyses.length - 1;
    }

    this.displayCurrentAnalysis();
  }

  private displayCurrentAnalysis(): void {
    if (this.currentAnalysisIndex < 0 || this.currentAnalysisIndex >= this.moveAnalyses.length) {
      return;
    }

    const analysis = this.moveAnalyses[this.currentAnalysisIndex];

    // Update Move Explanation section
    const moveExplanationEl = document.getElementById('move-explanation');
    if (moveExplanationEl) {
      moveExplanationEl.textContent = analysis.explanation || 'No explanation available';
    }

    // Update Tactical Analysis section
    const tacticalAnalysisEl = document.getElementById('tactical-analysis');
    if (tacticalAnalysisEl) {
      tacticalAnalysisEl.textContent = analysis.tacticalAnalysis || 'No tactical analysis available';
    }

    // Update Strategic Plan section
    const strategicPlanEl = document.getElementById('strategic-plan');
    if (strategicPlanEl) {
      strategicPlanEl.textContent = analysis.strategicPlan || 'No strategic plan available';
    }

    // Update suggested moves and strategy tips for this analysis
    if (analysis.suggestedMoves) {
      this.updateSuggestedMoves(analysis.suggestedMoves);
    }
    if (analysis.strategyTips) {
      this.updateStrategyTips(analysis.strategyTips);
    }

    this.updateAnalysisNavigation();
  }

  private updateClaudeSections(analysis: any): void {
    // Update suggested moves section
    if (analysis.suggestedMoves) {
      this.updateSuggestedMoves(analysis.suggestedMoves);
    }

    // Update strategy tips section
    if (analysis.strategyTips) {
      this.updateStrategyTips(analysis.strategyTips);
    }
  }

  private updateSuggestedMoves(moves: string[]): void {
    const suggestedMovesEl = document.getElementById('suggested-moves');
    if (suggestedMovesEl) {
      suggestedMovesEl.innerHTML = '';
      moves.forEach((move, index) => {
        const moveDiv = document.createElement('div');
        moveDiv.className = 'move-suggestion';
        if (index === 0) {
          moveDiv.classList.add('best');
        }
        moveDiv.textContent = move;
        suggestedMovesEl.appendChild(moveDiv);
      });
    }
  }

  private updateStrategyTips(tips: string[]): void {
    const strategyTipsEl = document.getElementById('strategy-tips');
    if (strategyTipsEl) {
      const ul = strategyTipsEl.querySelector('ul');
      if (ul) {
        ul.innerHTML = '';
        tips.forEach(tip => {
          const li = document.createElement('li');
          li.textContent = tip;
          ul.appendChild(li);
        });
      }
    }
  }

  private updateAnalysisNavigation(): void {
    const prevBtn = document.getElementById('prev-analysis') as HTMLButtonElement;
    const nextBtn = document.getElementById('next-analysis') as HTMLButtonElement;
    const counter = document.getElementById('analysis-counter');

    if (this.moveAnalyses.length === 0) {
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (counter) counter.textContent = '-';
      return;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentAnalysisIndex <= 0;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentAnalysisIndex >= this.moveAnalyses.length - 1;
    }

    if (counter) {
      counter.textContent = `${this.currentAnalysisIndex + 1} / ${this.moveAnalyses.length}`;
    }
  }

  render(): void {
    this.renderBoard();
    this.renderStatus();
    this.renderMoveHistory();
    this.renderGuide();
    this.updateApiKeyStatus();
    this.updateAnalysisNavigation();

    // Check for pending promotion
    if (this.game.hasPendingPromotion()) {
      this.showPromotionModal();
    }
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
    if (this.game.isGameOver() || this.isAIThinking) {
      return;
    }

    // In AI mode, only allow moves for the player's color
    if (this.isAIMode && this.game.getCurrentTurn() !== this.playerColor) {
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
        const pieceNotation: Record<string, string> = {
          'knight': 'N',
          'bishop': 'B',
          'rook': 'R',
          'queen': 'Q',
          'king': 'K'
        };
        notation += pieceNotation[move.piece];
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
        const promotionNotation: Record<string, string> = {
          'knight': 'N',
          'bishop': 'B',
          'rook': 'R',
          'queen': 'Q'
        };
        notation += '=' + promotionNotation[move.promotionTo];
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

  private showPromotionModal(): void {
    const color = this.game.getPendingPromotionColor();
    if (!color) return;

    // Update piece symbols in modal based on color
    const pieceSymbols: Record<string, string> = {
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

  private hidePromotionModal(): void {
    this.promotionModal.classList.remove('show');
  }

  private handlePromotionChoice(pieceType: 'queen' | 'rook' | 'bishop' | 'knight'): void {
    this.game.completePromotion(pieceType);
    this.hidePromotionModal();
    this.render();
    this.checkAIMove();
  }

  private checkAIMove(): void {
    if (!this.isAIMode || this.game.isGameOver() || this.game.hasPendingPromotion()) {
      return;
    }

    const currentTurn = this.game.getCurrentTurn();
    const aiColor: Color = this.playerColor === 'white' ? 'black' : 'white';

    if (currentTurn === aiColor) {
      this.makeAIMove();
    }
  }

  private async makeAIMove(): Promise<void> {
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
    } else {
      this.isAIThinking = false;
      this.render();
    }
  }

  private renderGuide(): void {
    const moveHistory = this.game.getMoveHistory();
    const analysis = this.coach.analyzePosition(moveHistory);

    // Update opening name and description (from coach.ts - static data)
    const openingNameEl = document.querySelector('#opening-name .value');
    if (openingNameEl) {
      openingNameEl.textContent = analysis.openingName;
    }

    const openingDescEl = document.getElementById('opening-description');
    if (openingDescEl) {
      openingDescEl.textContent = analysis.openingDescription;
    }

    const playerOpeningEl = document.getElementById('player-opening');
    if (playerOpeningEl) {
      playerOpeningEl.textContent = analysis.playerOpening;
    }

    const opponentDefenseEl = document.getElementById('opponent-defense');
    if (opponentDefenseEl) {
      opponentDefenseEl.textContent = analysis.opponentDefense;
    }

    // Don't update suggested moves or strategy tips here - they come from Claude AI
    // Only show initial fallback if no Claude data is available yet
    if (moveHistory.length === 0) {
      this.updateSuggestedMoves(analysis.suggestedMoves);
      this.updateStrategyTips(analysis.strategyTips);
    }

    // Analyze last move with Claude AI (will update suggested moves and tips)
    if (moveHistory.length > 0) {
      this.analyzeMoveWithClaude(moveHistory);
    }
  }

  private async analyzeMoveWithClaude(moveHistory: Move[]): Promise<void> {
    const moveExplanationEl = document.getElementById('move-explanation');
    const tacticalAnalysisEl = document.getElementById('tactical-analysis');
    const strategicPlanEl = document.getElementById('strategic-plan');
    const loadingEl = document.querySelector('.analysis-loading') as HTMLElement;

    if (!moveExplanationEl || !tacticalAnalysisEl || !strategicPlanEl || !loadingEl) return;

    // Check if Claude API is configured
    if (!this.coach.getClaudeAPI().isConfigured()) {
      moveExplanationEl.textContent = 'Set your Claude API key below to enable AI move analysis.';
      tacticalAnalysisEl.textContent = 'Configure API key to see tactical analysis';
      strategicPlanEl.textContent = 'Configure API key to see strategic recommendations';
      return;
    }

    const lastMove = moveHistory[moveHistory.length - 1];
    const state = this.game.getState();
    const moveNumber = moveHistory.length;

    // Smart analysis logic: Skip analysis after user moves in AI mode
    // Only analyze opponent/AI moves to avoid rapid succession
    if (this.isAIMode) {
      const aiColor: Color = this.playerColor === 'white' ? 'black' : 'white';
      const lastMoveColor = lastMove.color;

      // Skip analysis if the last move was by the player (not the AI)
      if (lastMoveColor !== aiColor) {
        return;
      }
    }

    // Check if we already analyzed this move
    const alreadyAnalyzed = this.moveAnalyses.some(
      entry => entry.moveNumber === moveNumber
    );

    if (alreadyAnalyzed) {
      return;
    }

    // Show loading and clear previous content
    loadingEl.style.display = 'block';
    moveExplanationEl.textContent = '';
    tacticalAnalysisEl.textContent = '';
    strategicPlanEl.textContent = '';

    try {
      const analysis = await this.coach.analyzeLastMove(
        lastMove,
        moveHistory,
        state.board,
        state.currentTurn
      );

      // Hide loading
      loadingEl.style.display = 'none';

      if (!analysis.error) {
        // Store the analysis
        const moveNotation = this.moveToNotation(lastMove);
        const entry: MoveAnalysisEntry = {
          moveNumber,
          moveNotation,
          explanation: analysis.moveExplanation,
          tacticalAnalysis: analysis.tacticalAnalysis,
          strategicPlan: analysis.strategicPlan,
          suggestedMoves: analysis.suggestedMoves,
          strategyTips: analysis.strategyTips
        };

        this.moveAnalyses.push(entry);
        this.currentAnalysisIndex = this.moveAnalyses.length - 1;

        // Display the latest analysis (will update all sections)
        this.displayCurrentAnalysis();
        this.updateClaudeSections(analysis);
      } else {
        moveExplanationEl.textContent = analysis.moveExplanation;
        tacticalAnalysisEl.textContent = 'Error occurred during analysis';
        strategicPlanEl.textContent = 'Error occurred during analysis';
      }
    } catch (error) {
      loadingEl.style.display = 'none';
      moveExplanationEl.textContent = 'Error getting AI analysis. Please check your API key.';
      tacticalAnalysisEl.textContent = 'Analysis error';
      strategicPlanEl.textContent = 'Analysis error';
    }
  }
}
