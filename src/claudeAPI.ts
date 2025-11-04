// Claude API Integration for Chess Analysis

import { Board, Move, Color } from './types.js';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface ClaudeAnalysisResponse {
  moveExplanation: string;
  tacticalAnalysis: string;
  strategicPlan: string;
  error?: string;
}

export class ClaudeAPI {
  private config: ClaudeConfig | null = null;
  // Use proxy endpoint to avoid CORS issues
  // When deployed to Netlify/Vercel, this will route through serverless function
  private readonly API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/claude'  // Local development
    : '/.netlify/functions/claude-proxy'; // Production (Netlify)
  private readonly DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
  private readonly DEFAULT_MAX_TOKENS = 1024;

  constructor() {
    // Try to load API key from localStorage
    this.loadConfig();
  }

  /**
   * Set the API configuration
   */
  setConfig(apiKey: string, model?: string, maxTokens?: number): void {
    console.log('Setting API config...', { keyLength: apiKey.length });
    this.config = {
      apiKey,
      model: model || this.DEFAULT_MODEL,
      maxTokens: maxTokens || this.DEFAULT_MAX_TOKENS
    };
    this.saveConfig();
    console.log('API config saved. isConfigured:', this.isConfigured());
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return this.config !== null && this.config.apiKey.length > 0;
  }

  /**
   * Get API key (first 10 chars for display)
   */
  getApiKeyPreview(): string {
    if (!this.config || !this.config.apiKey) return '';
    return this.config.apiKey.substring(0, 10) + '...';
  }

  /**
   * Clear API configuration
   */
  clearConfig(): void {
    this.config = null;
    localStorage.removeItem('chess_claude_config');
  }

  /**
   * Save config to localStorage
   */
  private saveConfig(): void {
    if (this.config) {
      const configString = JSON.stringify(this.config);
      localStorage.setItem('chess_claude_config', configString);
      console.log('Config saved to localStorage:', { keyPreview: this.getApiKeyPreview() });
    }
  }

  /**
   * Load config from localStorage
   */
  private loadConfig(): void {
    const saved = localStorage.getItem('chess_claude_config');
    console.log('Loading config from localStorage:', saved ? 'Found' : 'Not found');
    if (saved) {
      try {
        this.config = JSON.parse(saved);
        console.log('Config loaded successfully:', { keyPreview: this.getApiKeyPreview() });
      } catch (e) {
        console.error('Failed to load API config:', e);
      }
    }
  }

  /**
   * Analyze the last move made
   */
  async analyzeMove(
    lastMove: Move,
    moveHistory: Move[],
    boardState: Board,
    currentTurn: Color
  ): Promise<ClaudeAnalysisResponse> {
    if (!this.isConfigured()) {
      return {
        moveExplanation: 'Please set your Claude API key in the AI Settings section below.',
        tacticalAnalysis: '',
        strategicPlan: '',
        error: 'API key not configured'
      };
    }

    try {
      const prompt = this.buildMoveAnalysisPrompt(lastMove, moveHistory, boardState, currentTurn);
      const response = await this.callClaudeAPI(prompt);
      return this.parseMoveAnalysis(response);
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        moveExplanation: 'Error analyzing move. Please check your API key and try again.',
        tacticalAnalysis: '',
        strategicPlan: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build prompt for move analysis
   */
  private buildMoveAnalysisPrompt(
    lastMove: Move,
    moveHistory: Move[],
    boardState: Board,
    currentTurn: Color
  ): string {
    const fen = this.boardToFEN(boardState, currentTurn);
    const moveNotation = this.moveToAlgebraic(lastMove);
    const moveNumber = Math.floor(moveHistory.length / 2) + 1;
    const moveColor = lastMove.color;

    const historyPGN = this.movesToPGN(moveHistory);

    return `You are an expert chess coach analyzing a game.

Game State:
- Move ${moveNumber}: ${moveColor} just played ${moveNotation}
- Current position (FEN): ${fen}
- Move history (PGN): ${historyPGN}

Please analyze this move and provide:

1. **Move Explanation** (2-3 sentences): Explain what this move accomplishes, its immediate purpose, and whether it's a good or bad move.

2. **Tactical Elements** (1-2 sentences): Are there any tactical threats, opportunities, or vulnerabilities created by this move?

3. **Strategic Plan** (1-2 sentences): What should the opponent consider in response? What's the best continuation?

Keep your response concise, educational, and friendly. Focus on helping a player understand chess principles.

Format your response as:
EXPLANATION: [your explanation]
TACTICS: [tactical analysis]
STRATEGY: [strategic recommendation]`;
  }

  /**
   * Call Claude API through proxy
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    if (!this.config) {
      throw new Error('API not configured');
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: this.config.apiKey,
          prompt: prompt
        })
      });

      if (!response.ok) {
        const error = await response.text();

        // Provide helpful error message for CORS issues
        if (error.includes('CORS') || response.status === 0) {
          throw new Error(
            'CORS Error: This app needs to be deployed to Netlify or Vercel to work. ' +
            'GitHub Pages does not support serverless functions. ' +
            'See DEPLOYMENT.md for instructions.'
          );
        }

        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Network Error: Please deploy this app to Netlify or Vercel to enable Claude AI. ' +
          'Direct browser calls to Claude API are blocked by CORS. ' +
          'See DEPLOYMENT.md for setup instructions.'
        );
      }
      throw error;
    }
  }

  /**
   * Parse Claude's response
   */
  private parseMoveAnalysis(response: string): ClaudeAnalysisResponse {
    const explanationMatch = response.match(/EXPLANATION:\s*(.+?)(?=TACTICS:|$)/s);
    const tacticsMatch = response.match(/TACTICS:\s*(.+?)(?=STRATEGY:|$)/s);
    const strategyMatch = response.match(/STRATEGY:\s*(.+?)$/s);

    return {
      moveExplanation: explanationMatch?.[1]?.trim() || response.substring(0, 300),
      tacticalAnalysis: tacticsMatch?.[1]?.trim() || '',
      strategicPlan: strategyMatch?.[1]?.trim() || ''
    };
  }

  /**
   * Convert board to FEN notation
   */
  private boardToFEN(board: Board, currentTurn: Color): string {
    let fen = '';

    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          const symbol = this.pieceToFEN(piece);
          fen += symbol;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }
      if (row < 7) {
        fen += '/';
      }
    }

    // Active color
    fen += ` ${currentTurn === 'white' ? 'w' : 'b'}`;

    // Castling, en passant, halfmove, fullmove (simplified)
    fen += ' KQkq - 0 1';

    return fen;
  }

  /**
   * Convert piece to FEN symbol
   */
  private pieceToFEN(piece: { type: string; color: Color }): string {
    const symbols: Record<string, string> = {
      pawn: 'p',
      knight: 'n',
      bishop: 'b',
      rook: 'r',
      queen: 'q',
      king: 'k'
    };
    const symbol = symbols[piece.type];
    return piece.color === 'white' ? symbol.toUpperCase() : symbol;
  }

  /**
   * Convert move to algebraic notation
   */
  private moveToAlgebraic(move: Move): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fromFile = files[move.from.col];
    const fromRank = 8 - move.from.row;
    const toFile = files[move.to.col];
    const toRank = 8 - move.to.row;

    let notation = '';

    if (move.isCastling) {
      return move.to.col === 6 ? 'O-O' : 'O-O-O';
    }

    if (move.piece !== 'pawn') {
      notation += move.piece[0].toUpperCase();
    }

    if (move.captured || move.isEnPassant) {
      if (move.piece === 'pawn') {
        notation += fromFile;
      }
      notation += 'x';
    }

    notation += toFile + toRank;

    if (move.promotionTo) {
      notation += '=' + move.promotionTo[0].toUpperCase();
    }

    if (move.isCheckmate) {
      notation += '#';
    } else if (move.isCheck) {
      notation += '+';
    }

    return notation;
  }

  /**
   * Convert move history to PGN format
   */
  private movesToPGN(moves: Move[]): string {
    let pgn = '';
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = this.moveToAlgebraic(moves[i]);
      const blackMove = moves[i + 1] ? this.moveToAlgebraic(moves[i + 1]) : '';
      pgn += `${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''} `;
    }
    return pgn.trim();
  }
}
