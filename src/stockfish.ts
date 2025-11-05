// Stockfish Engine Wrapper for Chess Analysis
// Uses UCI (Universal Chess Interface) protocol

import { Board, Color, Move, Position } from './types.js';

export interface StockfishMove {
  move: string; // UCI format (e.g., "e2e4")
  score: number; // Centipawn evaluation (positive = white advantage)
  mate?: number; // Moves to mate (if applicable)
  pv?: string[]; // Principal variation (sequence of best moves)
}

export interface StockfishAnalysis {
  bestMoves: StockfishMove[];
  evaluation: number; // Overall position evaluation
  depth: number; // Search depth reached
}

export class StockfishEngine {
  private engine: Worker | null = null;
  private initialized: boolean = false;
  private ready: boolean = false;
  private pendingCommands: Array<{ command: string; resolve: (value: string) => void }> = [];
  private messageBuffer: string = '';

  constructor() {
    this.initEngine();
  }

  /**
   * Initialize Stockfish engine worker
   */
  private async initEngine(): Promise<void> {
    try {
      // Create Web Worker pointing to stockfish WASM file
      // Use the lite single-threaded version for better browser compatibility
      const stockfishPath = './stockfish/stockfish-17.1-lite-single-03e3232.js';
      console.log('Initializing Stockfish from:', stockfishPath);

      this.engine = new Worker(stockfishPath);

      this.engine.onerror = (error) => {
        console.error('Stockfish Worker error:', error);
        this.initialized = false;
      };

      this.engine.onmessage = (event) => {
        console.log('Stockfish message:', event.data);
        this.handleEngineMessage(event.data);
      };

      // Send initial UCI commands with timeout
      const initTimeout = setTimeout(() => {
        console.error('Stockfish initialization timeout');
        this.initialized = false;
      }, 10000);

      await this.sendCommand('uci');
      await this.waitForReady();
      await this.sendCommand('setoption name MultiPV value 5'); // Get top 5 moves

      clearTimeout(initTimeout);
      this.initialized = true;
      console.log('✅ Stockfish engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Stockfish:', error);
      console.log('App will continue without Stockfish analysis.');
      this.initialized = false;
      // Don't throw - allow app to work without Stockfish
    }
  }

  /**
   * Handle messages from Stockfish engine
   */
  private handleEngineMessage(message: string): void {
    this.messageBuffer += message + '\n';

    // Check for ready signal
    if (message.includes('readyok')) {
      this.ready = true;
    }

    // Process pending commands
    if (this.pendingCommands.length > 0) {
      const pending = this.pendingCommands[0];
      if (message.includes('readyok') || message.includes('uciok')) {
        this.pendingCommands.shift();
        pending.resolve(this.messageBuffer);
        this.messageBuffer = '';
      }
    }
  }

  /**
   * Send command to Stockfish and wait for response
   */
  private async sendCommand(command: string): Promise<string> {
    return new Promise((resolve) => {
      if (!this.engine) {
        resolve('');
        return;
      }

      this.pendingCommands.push({ command, resolve });
      this.engine.postMessage(command);

      // Send isready to get confirmation
      setTimeout(() => {
        if (this.engine) {
          this.engine.postMessage('isready');
        }
      }, 10);
    });
  }

  /**
   * Wait for engine to be ready
   */
  private async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.ready) {
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
    });
  }

  /**
   * Analyze a position and get top moves
   */
  async analyzePosition(
    fen: string,
    depth: number = 15,
    timeMs: number = 1000
  ): Promise<StockfishAnalysis> {
    console.log('🔧 Stockfish: analyzePosition called with FEN:', fen);
    console.log('🔧 Stockfish: Initialized?', this.initialized, 'Engine?', !!this.engine);

    if (!this.initialized || !this.engine) {
      console.warn('⚠️ Stockfish: Engine not initialized, returning empty analysis');
      return {
        bestMoves: [],
        evaluation: 0,
        depth: 0
      };
    }

    // Set up position
    console.log('🔧 Stockfish: Setting position...');
    await this.sendCommand(`position fen ${fen}`);

    // Start analysis
    console.log('🔧 Stockfish: Starting analysis with depth', depth, 'and time', timeMs);
    this.messageBuffer = '';
    this.engine.postMessage(`go depth ${depth} movetime ${timeMs}`);

    // Wait for analysis to complete
    await new Promise((resolve) => setTimeout(resolve, timeMs + 500));

    console.log('🔧 Stockfish: Analysis complete, buffer length:', this.messageBuffer.length);
    console.log('🔧 Stockfish: Buffer preview:', this.messageBuffer.substring(0, 500));

    // Parse results
    const result = this.parseAnalysis(this.messageBuffer);
    console.log('🔧 Stockfish: Parsed result:', result);
    return result;
  }

  /**
   * Parse Stockfish analysis output
   */
  private parseAnalysis(output: string): StockfishAnalysis {
    const lines = output.split('\n');
    const moveMap = new Map<string, StockfishMove>();
    let maxDepth = 0;
    let overallEval = 0;

    for (const line of lines) {
      if (!line.startsWith('info')) continue;

      // Parse depth
      const depthMatch = line.match(/depth (\d+)/);
      if (depthMatch) {
        maxDepth = Math.max(maxDepth, parseInt(depthMatch[1]));
      }

      // Parse multipv (which line we're analyzing)
      const multipvMatch = line.match(/multipv (\d+)/);
      if (!multipvMatch) continue;

      // Parse score
      let score = 0;
      let mate: number | undefined;
      const scoreMatch = line.match(/score cp (-?\d+)/);
      const mateMatch = line.match(/score mate (-?\d+)/);

      if (mateMatch) {
        mate = parseInt(mateMatch[1]);
        score = mate > 0 ? 100000 : -100000; // Mate is always better/worse than any position
      } else if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
      }

      // Parse principal variation (best move sequence)
      const pvMatch = line.match(/pv (.+)$/);
      if (!pvMatch) continue;

      const pvMoves = pvMatch[1].split(' ').filter(m => m.length > 0);
      const bestMove = pvMoves[0];

      // Validate bestMove is a proper UCI move (at least 4 chars: e.g., e2e4)
      if (bestMove && bestMove.length >= 4) {
        moveMap.set(bestMove, {
          move: bestMove,
          score: score,
          mate: mate,
          pv: pvMoves
        });

        // First move is the overall best evaluation
        if (multipvMatch[1] === '1') {
          overallEval = score;
        }
      } else if (bestMove) {
        console.warn('⚠️ Skipping invalid UCI move from Stockfish:', bestMove, 'in line:', line);
      }
    }

    // Convert to sorted array (best moves first)
    const bestMoves = Array.from(moveMap.values()).sort((a, b) => {
      // Prioritize mate
      if (a.mate !== undefined && b.mate === undefined) return -1;
      if (b.mate !== undefined && a.mate === undefined) return 1;
      if (a.mate !== undefined && b.mate !== undefined) {
        // Faster mate is better
        return Math.abs(a.mate) - Math.abs(b.mate);
      }
      // Otherwise sort by score
      return b.score - a.score;
    });

    return {
      bestMoves: bestMoves.slice(0, 5), // Top 5 moves
      evaluation: overallEval,
      depth: maxDepth
    };
  }

  /**
   * Convert board state to FEN notation
   */
  boardToFEN(board: Board, currentTurn: Color, moveHistory?: Move[]): string {
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

    // Castling rights (simplified - would need game state to be accurate)
    fen += ' KQkq';

    // En passant target (simplified - would need last move info)
    fen += ' -';

    // Halfmove clock and fullmove number
    const moveCount = moveHistory ? Math.floor(moveHistory.length / 2) + 1 : 1;
    fen += ` 0 ${moveCount}`;

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
   * Convert UCI move to human-readable format
   */
  uciToAlgebraic(uciMove: string, board: Board): string {
    // Validate input
    if (!uciMove || uciMove.length < 4) {
      console.warn('⚠️ Invalid UCI move:', uciMove);
      return uciMove || '???';
    }

    // UCI format: e2e4, e7e5q (with promotion)
    const fromFile = uciMove[0];
    const fromRank = uciMove[1];
    const toFile = uciMove[2];
    const toRank = uciMove[3];
    const promotion = uciMove[4];

    // Get piece at source position
    const fromCol = fromFile.charCodeAt(0) - 97; // 'a' = 0
    const fromRow = 8 - parseInt(fromRank);
    const piece = board[fromRow]?.[fromCol];

    let notation = '';

    // Add piece prefix (except for pawns)
    if (piece && piece.type !== 'pawn') {
      const pieceNotation: Record<string, string> = {
        knight: 'N',
        bishop: 'B',
        rook: 'R',
        queen: 'Q',
        king: 'K'
      };
      notation += pieceNotation[piece.type] || '';
    }

    // Check if it's a capture
    const toCol = toFile.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(toRank);
    const targetPiece = board[toRow]?.[toCol];

    if (targetPiece || (piece?.type === 'pawn' && fromFile !== toFile)) {
      // Pawn captures need the file prefix
      if (piece?.type === 'pawn') {
        notation += fromFile;
      }
      notation += 'x';
    }

    notation += toFile + toRank;

    // Add promotion
    if (promotion) {
      const promotionNotation: Record<string, string> = {
        q: 'Q',
        r: 'R',
        b: 'B',
        n: 'N'
      };
      notation += '=' + (promotionNotation[promotion] || 'Q');
    }

    return notation;
  }

  /**
   * Get evaluation as human-readable string
   */
  formatEvaluation(score: number, mate?: number): string {
    if (mate !== undefined) {
      return `M${mate > 0 ? '+' : ''}${mate}`;
    }

    const pawns = (score / 100).toFixed(1);
    return `${score > 0 ? '+' : ''}${pawns}`;
  }

  /**
   * Terminate the engine
   */
  terminate(): void {
    if (this.engine) {
      this.engine.postMessage('quit');
      this.engine.terminate();
      this.engine = null;
      this.initialized = false;
    }
  }
}
