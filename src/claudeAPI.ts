// Claude API Integration for Chess Analysis

import { Board, Move, Color } from './types.js';
import { StockfishAnalysis } from './stockfish.js';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface ClaudeAnalysisResponse {
  moveExplanation: string;
  tacticalAnalysis: string;
  strategicPlan: string;
  suggestedMoves: string[];
  strategyTips: string[];
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
  private responseCache: Map<string, ClaudeAnalysisResponse> = new Map();

  constructor() {
    // Try to load API key from localStorage
    this.loadConfig();
    // Load cached responses from localStorage
    this.loadCache();
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
   * Load response cache from localStorage
   */
  private loadCache(): void {
    try {
      const saved = localStorage.getItem('chess_analysis_cache');
      if (saved) {
        const cacheArray = JSON.parse(saved);
        this.responseCache = new Map(cacheArray);
        console.log('Loaded', this.responseCache.size, 'cached responses');
      }
    } catch (e) {
      console.error('Failed to load cache:', e);
      this.responseCache = new Map();
    }
  }

  /**
   * Save response cache to localStorage
   */
  private saveCache(): void {
    try {
      const cacheArray = Array.from(this.responseCache.entries());
      // Keep only last 50 entries to avoid localStorage limits
      const trimmedCache = cacheArray.slice(-50);
      localStorage.setItem('chess_analysis_cache', JSON.stringify(trimmedCache));
    } catch (e) {
      console.error('Failed to save cache:', e);
    }
  }

  /**
   * Generate cache key from move history
   */
  private getCacheKey(moveHistory: Move[]): string {
    // Use PGN notation as cache key - identical move sequences get same analysis
    return this.movesToPGN(moveHistory);
  }

  /**
   * Analyze the last move made
   */
  async analyzeMove(
    lastMove: Move,
    moveHistory: Move[],
    boardState: Board,
    currentTurn: Color,
    stockfishAnalysis?: StockfishAnalysis | null
  ): Promise<ClaudeAnalysisResponse> {
    if (!this.isConfigured()) {
      return {
        moveExplanation: 'Please set your Claude API key in the AI Settings section below.',
        tacticalAnalysis: '',
        strategicPlan: '',
        suggestedMoves: [],
        strategyTips: [],
        error: 'API key not configured'
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(moveHistory);
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      console.log('Using cached analysis for:', cacheKey);
      return cached;
    }

    try {
      const prompt = this.buildMoveAnalysisPrompt(lastMove, moveHistory, boardState, currentTurn, stockfishAnalysis);
      const response = await this.callClaudeAPI(prompt);
      const analysis = this.parseMoveAnalysis(response, stockfishAnalysis);

      // Cache the response
      this.responseCache.set(cacheKey, analysis);
      this.saveCache();
      console.log('Cached new analysis for:', cacheKey);

      return analysis;
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        moveExplanation: 'Error analyzing move. Please check your API key and try again.',
        tacticalAnalysis: '',
        strategicPlan: '',
        suggestedMoves: [],
        strategyTips: [],
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
    currentTurn: Color,
    stockfishAnalysis?: StockfishAnalysis | null
  ): string {
    const fen = this.boardToFEN(boardState, currentTurn);
    const moveNotation = this.moveToAlgebraic(lastMove);
    const moveNumber = Math.floor(moveHistory.length / 2) + 1;
    const moveColor = lastMove.color;

    const historyPGN = this.movesToPGN(moveHistory);

    // Build Stockfish suggestions section
    let stockfishSection = '';
    if (stockfishAnalysis && stockfishAnalysis.bestMoves.length > 0) {
      stockfishSection = '\n\n**Stockfish Top Moves:**\n';
      stockfishAnalysis.bestMoves.slice(0, 5).forEach((move, index) => {
        const evalStr = move.mate !== undefined
          ? `Mate in ${Math.abs(move.mate)}`
          : `${(move.score / 100).toFixed(1)} pawns`;

        // Convert UCI to readable format
        const from = move.move.substring(0, 2);
        const to = move.move.substring(2, 4);
        const promotion = move.move[4] ? `=${move.move[4].toUpperCase()}` : '';
        const moveStr = `${from}-${to}${promotion}`;

        stockfishSection += `${index + 1}. ${moveStr} (${evalStr})\n`;
      });
      stockfishSection += `\nPosition Evaluation: ${(stockfishAnalysis.evaluation / 100).toFixed(1)} (positive = white advantage)`;
    }

    const basePrompt = `You are an expert chess coach analyzing a game.

Game State:
- Move ${moveNumber}: ${moveColor} just played ${moveNotation}
- Current position (FEN): ${fen}
- Move history (PGN): ${historyPGN}${stockfishSection}

Analyze this move and provide:

1. **Move Explanation** (2-3 sentences): Explain what this move accomplishes, its immediate purpose, and whether it's a good or bad move.

2. **Tactical Elements** (1-2 sentences): Are there any tactical threats, opportunities, or vulnerabilities created by this move?

3. **Strategic Plan** (1-2 sentences): What should ${currentTurn} consider in response? What's the best continuation?`;

    // Adjust suggested moves section based on whether we have Stockfish
    if (stockfishSection) {
      return basePrompt + `

4. **Suggested Moves** (2-4 moves): Using the Stockfish analysis above, explain in simple chess notation (like "Nf3", "d4", etc.) why the top moves are good. Convert the UCI notation above to proper algebraic notation.

5. **Strategy Tips** (2-4 tips): Provide practical strategic principles or tips relevant to this position.

Keep your response concise, educational, and friendly. Focus on helping a player understand chess principles.`;
    } else {
      return basePrompt + `

4. **Suggested Moves** (2-4 moves): Provide specific chess moves in algebraic notation that ${currentTurn} should consider. Use proper notation (N for knight, B for bishop, R for rook, Q for queen, K for king).

5. **Strategy Tips** (2-4 tips): Provide practical strategic principles or tips relevant to this position.

Keep your response concise, educational, and friendly. Focus on helping a player understand chess principles.`;
    }
  }

  /**
   * Get tool definition for structured output
   */
  private getAnalysisTool() {
    return {
      name: "provide_chess_analysis",
      description: "Provide structured analysis of a chess move including explanation, tactical analysis, strategic recommendations, suggested moves, and strategy tips",
      input_schema: {
        type: "object",
        properties: {
          moveExplanation: {
            type: "string",
            description: "2-3 sentence explanation of what the move accomplishes, its purpose, and whether it's good or bad"
          },
          tacticalAnalysis: {
            type: "string",
            description: "1-2 sentence analysis of tactical threats, opportunities, or vulnerabilities created by this move"
          },
          strategicPlan: {
            type: "string",
            description: "1-2 sentence recommendation for what the opponent should consider in response and best continuation"
          },
          suggestedMoves: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of 2-4 suggested chess moves in algebraic notation (e.g., ['Nf3', 'd4', 'Bc4']) for the opponent to consider in response"
          },
          strategyTips: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of 2-4 strategic tips or principles relevant to the current position (e.g., ['Control the center', 'Develop knights before bishops'])"
          }
        },
        required: ["moveExplanation", "tacticalAnalysis", "strategicPlan", "suggestedMoves", "strategyTips"]
      }
    };
  }

  /**
   * Call Claude API through proxy
   */
  private async callClaudeAPI(prompt: string): Promise<any> {
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
          prompt: prompt,
          tools: [this.getAnalysisTool()],
          tool_choice: { type: "tool", name: "provide_chess_analysis" }
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

      // Handle tool use response
      if (data.content && data.content[0]?.type === 'tool_use') {
        return data.content[0].input;
      }

      // Fallback to text response for backward compatibility
      if (data.content && data.content[0]?.text) {
        return { text: data.content[0].text };
      }

      return data;
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
  private parseMoveAnalysis(response: any, stockfishAnalysis?: StockfishAnalysis | null): ClaudeAnalysisResponse {
    // Handle structured output from tool use
    if (response.moveExplanation && response.tacticalAnalysis && response.strategicPlan) {
      let suggestedMoves = response.suggestedMoves || [];

      // If we have Stockfish analysis and Claude didn't provide moves, use Stockfish moves
      if (suggestedMoves.length === 0 && stockfishAnalysis && stockfishAnalysis.bestMoves.length > 0) {
        suggestedMoves = stockfishAnalysis.bestMoves.slice(0, 4).map(move => {
          const from = move.move.substring(0, 2);
          const to = move.move.substring(2, 4);
          const evalStr = move.mate !== undefined
            ? `(M${Math.abs(move.mate)})`
            : `(${(move.score / 100).toFixed(1)})`;
          return `${from}-${to} ${evalStr}`;
        });
      }

      return {
        moveExplanation: response.moveExplanation,
        tacticalAnalysis: response.tacticalAnalysis,
        strategicPlan: response.strategicPlan,
        suggestedMoves: suggestedMoves,
        strategyTips: response.strategyTips || []
      };
    }

    // Fallback: Handle old text-based format for backward compatibility
    if (typeof response === 'string' || response.text) {
      const text = typeof response === 'string' ? response : response.text;
      const explanationMatch = text.match(/EXPLANATION:\s*(.+?)(?=TACTICS:|$)/s);
      const tacticsMatch = text.match(/TACTICS:\s*(.+?)(?=STRATEGY:|$)/s);
      const strategyMatch = text.match(/STRATEGY:\s*(.+?)$/s);

      return {
        moveExplanation: explanationMatch?.[1]?.trim() || text.substring(0, 300),
        tacticalAnalysis: tacticsMatch?.[1]?.trim() || '',
        strategicPlan: strategyMatch?.[1]?.trim() || '',
        suggestedMoves: [],
        strategyTips: []
      };
    }

    // Default fallback
    return {
      moveExplanation: 'Unable to parse response',
      tacticalAnalysis: '',
      strategicPlan: '',
      suggestedMoves: [],
      strategyTips: []
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
      const pieceNotation: Record<string, string> = {
        'knight': 'N',
        'bishop': 'B',
        'rook': 'R',
        'queen': 'Q',
        'king': 'K'
      };
      notation += pieceNotation[move.piece];
    }

    if (move.captured || move.isEnPassant) {
      if (move.piece === 'pawn') {
        notation += fromFile;
      }
      notation += 'x';
    }

    notation += toFile + toRank;

    if (move.promotionTo) {
      const promotionNotation: Record<string, string> = {
        'knight': 'N',
        'bishop': 'B',
        'rook': 'R',
        'queen': 'Q'
      };
      notation += '=' + promotionNotation[move.promotionTo];
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
