// Chess Coach - Opening detection and move suggestions
import { ClaudeAPI } from './claudeAPI.js';
import { StockfishEngine } from './stockfish.js';
export class ChessCoach {
    constructor() {
        this.openingsDatabase = [
            // King's Pawn Openings (e4) - Progressive depth
            {
                name: 'King\'s Pawn Opening',
                moves: ['e2e4'],
                description: 'The most popular opening. Controls the center and frees the queen and bishop.',
                category: 'e4',
                nextMoves: ['e5', 'c5', 'e6', 'c6', 'd6'],
                tips: ['Control the center', 'Develop pieces quickly', 'Castle early']
            },
            {
                name: 'Open Game',
                moves: ['e2e4', 'e7e5'],
                description: 'Both sides stake claim to the center with pawns.',
                category: 'e4',
                nextMoves: ['Nf3', 'Bc4', 'f4'],
                tips: ['Develop knights before bishops', 'Control the center', 'Prepare to castle']
            },
            {
                name: 'King\'s Knight Opening',
                moves: ['e2e4', 'e7e5', 'g1f3'],
                description: 'Natural development attacking the e5 pawn.',
                category: 'e4',
                nextMoves: ['Nc6', 'Nf6', 'd6'],
                tips: ['Most common third move', 'Attacks center', 'Flexible']
            },
            {
                name: 'King\'s Knight: Two Knights Defense',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'],
                description: 'Black develops the knight defending the e5 pawn.',
                category: 'e4',
                nextMoves: ['Bc4', 'Bb5', 'd4'],
                tips: ['Solid defense', 'Symmetrical development', 'Many variations ahead']
            },
            {
                name: 'Italian Game',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
                description: 'Classic opening aiming to control the center and develop quickly.',
                category: 'e4',
                nextMoves: ['Bc5', 'Nf6', 'd6'],
                tips: ['Develop bishop to active square', 'Prepare d4 push', 'Castle kingside']
            },
            {
                name: 'Italian Game: Giuoco Piano',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5'],
                description: 'The quiet game - both sides develop bishops.',
                category: 'e4',
                nextMoves: ['c3', 'd3', 'Nc3'],
                tips: ['Slow buildup', 'Prepare d4 break', 'Castle soon']
            },
            {
                name: 'Spanish Opening (Ruy Lopez)',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
                description: 'One of the oldest and most respected openings. Puts pressure on the center.',
                category: 'e4',
                nextMoves: ['a6', 'Nf6', 'f6'],
                tips: ['Maintain central pressure', 'Be ready to castle', 'Prepare d4 advance']
            },
            {
                name: 'Ruy Lopez: Morphy Defense',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6'],
                description: 'Most popular response, asking the bishop\'s intentions.',
                category: 'e4',
                nextMoves: ['Ba4', 'Bxc6'],
                tips: ['Question the bishop', 'Prepare b5', 'Solid and sound']
            },
            {
                name: 'Petrov Defense',
                moves: ['e2e4', 'e7e5', 'g1f3', 'g8f6'],
                description: 'Symmetric counter-attack on the e4 pawn.',
                category: 'e4',
                nextMoves: ['Nxe5', 'd4', 'Nc3'],
                tips: ['Solid but passive', 'Draw tendency', 'Very reliable']
            },
            // Sicilian variations
            {
                name: 'Sicilian Defense',
                moves: ['e2e4', 'c7c5'],
                description: 'The most popular defense to 1.e4. Black fights for the center asymmetrically.',
                category: 'e4',
                nextMoves: ['Nf3', 'd4', 'Nc3'],
                tips: ['Complex positions ahead', 'Black gets queenside pawn majority', 'Sharp tactical play']
            },
            {
                name: 'Sicilian Defense: Open',
                moves: ['e2e4', 'c7c5', 'g1f3'],
                description: 'Preparing to open the center with d4.',
                category: 'e4',
                nextMoves: ['d6', 'Nc6', 'e6'],
                tips: ['Main line Sicilian', 'Sharp play ahead', 'Very theoretical']
            },
            {
                name: 'Sicilian Defense: Closed',
                moves: ['e2e4', 'c7c5', 'b1c3'],
                description: 'Avoiding main lines, slower buildup.',
                category: 'e4',
                nextMoves: ['Nc6', 'e6', 'd6'],
                tips: ['Positional approach', 'King-side attack', 'Less theoretical']
            },
            // French variations
            {
                name: 'French Defense',
                moves: ['e2e4', 'e7e6'],
                description: 'Solid defense that creates a strong pawn chain.',
                category: 'e4',
                nextMoves: ['d4', 'Nf3', 'Nc3'],
                tips: ['Black will play d5', 'Closed position typical', 'Long-term strategic play']
            },
            {
                name: 'French Defense: Advance',
                moves: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'e4e5'],
                description: 'White gains space in the center.',
                category: 'e4',
                nextMoves: ['c5', 'Ne7', 'b6'],
                tips: ['Space advantage', 'King-side attack', 'Central tension']
            },
            // Caro-Kann variations
            {
                name: 'Caro-Kann Defense',
                moves: ['e2e4', 'c7c6'],
                description: 'Solid defense where Black prepares d5 without blocking the light bishop.',
                category: 'e4',
                nextMoves: ['d4', 'Nc3', 'Nf3'],
                tips: ['Similar to French but bishop freer', 'Solid and reliable', 'Less sharp than Sicilian']
            },
            {
                name: 'Caro-Kann: Advance',
                moves: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'e4e5'],
                description: 'Space-gaining approach similar to French Advance.',
                category: 'e4',
                nextMoves: ['Bf5', 'c5', 'e6'],
                tips: ['Space advantage', 'Restrict black pieces', 'King-side pressure']
            },
            // Queen's Pawn Openings (d4) - Progressive depth
            {
                name: 'Queen\'s Pawn Opening',
                moves: ['d2d4'],
                description: 'Solid opening controlling the center. Leads to strategic positions.',
                category: 'd4',
                nextMoves: ['d5', 'Nf6', 'f5', 'e6'],
                tips: ['Control center', 'Develop knights first', 'Prepare c4']
            },
            {
                name: 'Closed Game',
                moves: ['d2d4', 'd7d5'],
                description: 'Symmetric central pawn structure.',
                category: 'd4',
                nextMoves: ['c4', 'Nf3', 'e3'],
                tips: ['Positional play', 'Slow maneuvering', 'Strategic battles']
            },
            {
                name: 'Queen\'s Gambit',
                moves: ['d2d4', 'd7d5', 'c2c4'],
                description: 'One of the oldest openings. Offers a pawn to gain central control.',
                category: 'd4',
                nextMoves: ['dxc4', 'e6', 'c6'],
                tips: ['The pawn is not really sacrificed', 'Leads to rich positions', 'Very popular at all levels']
            },
            {
                name: 'Queen\'s Gambit Accepted',
                moves: ['d2d4', 'd7d5', 'c2c4', 'd5c4'],
                description: 'Black accepts the gambit pawn.',
                category: 'd4',
                nextMoves: ['Nf3', 'e3', 'e4'],
                tips: ['Temporary material', 'White gets center', 'Active play']
            },
            {
                name: 'Queen\'s Gambit Declined',
                moves: ['d2d4', 'd7d5', 'c2c4', 'e7e6'],
                description: 'Classical solid response maintaining the center.',
                category: 'd4',
                nextMoves: ['Nc3', 'Nf3', 'cxd5'],
                tips: ['Solid structure', 'Rich theory', 'Very reliable']
            },
            {
                name: 'Indian Defense',
                moves: ['d2d4', 'g8f6'],
                description: 'Hypermodern approach - Black controls center from distance.',
                category: 'd4',
                nextMoves: ['c4', 'Nf3', 'Bg5'],
                tips: ['Black delays central occupation', 'Flexible setup', 'Can transpose to many systems']
            },
            {
                name: 'King\'s Indian Defense',
                moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6'],
                description: 'Aggressive counter-attacking setup for Black.',
                category: 'd4',
                nextMoves: ['Bg7', 'd6', 'O-O'],
                tips: ['Black fianchettoes kingside bishop', 'Sharp attacking play', 'Opposite side castling common']
            },
            {
                name: 'King\'s Indian: Classical',
                moves: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7'],
                description: 'Main line King\'s Indian setup.',
                category: 'd4',
                nextMoves: ['e4', 'Nf3', 'Be2'],
                tips: ['Black castles next', 'Central tension', 'Both sides attack']
            },
            // Other Openings - Progressive depth
            {
                name: 'English Opening',
                moves: ['c2c4'],
                description: 'Flexible opening that can transpose to many structures.',
                category: 'flank',
                nextMoves: ['e5', 'Nf6', 'e6', 'c5'],
                tips: ['Very flexible', 'Reverse Sicilian if Black plays e5', 'Control center from flank']
            },
            {
                name: 'English: Symmetrical',
                moves: ['c2c4', 'c7c5'],
                description: 'Symmetrical pawn structure.',
                category: 'flank',
                nextMoves: ['Nc3', 'Nf3', 'g3'],
                tips: ['Maneuvering game', 'Long-term planning', 'Positional']
            },
            {
                name: 'Reti Opening',
                moves: ['g1f3'],
                description: 'Hypermodern opening delaying central pawn moves.',
                category: 'flank',
                nextMoves: ['d5', 'Nf6', 'e5'],
                tips: ['Very flexible', 'Control center with pieces', 'Can transpose to d4 or c4 systems']
            },
            {
                name: 'Reti: King\'s Indian Attack',
                moves: ['g1f3', 'g8f6', 'g2g3'],
                description: 'Fianchetto setup for White.',
                category: 'flank',
                nextMoves: ['d5', 'g6', 'e6'],
                tips: ['Solid setup', 'King-side focus', 'Slow buildup']
            }
        ];
        this.claudeAPI = new ClaudeAPI();
        this.stockfish = new StockfishEngine();
    }
    /**
     * Get Claude API instance for configuration
     */
    getClaudeAPI() {
        return this.claudeAPI;
    }
    /**
     * Get Stockfish engine instance
     */
    getStockfish() {
        return this.stockfish;
    }
    /**
     * Analyze the current game state and provide coaching guidance
     */
    analyzePosition(moveHistory) {
        if (moveHistory.length === 0) {
            return this.getStartingGuidance();
        }
        const moveSequence = this.convertMovesToNotation(moveHistory);
        const detectedOpening = this.detectOpening(moveSequence);
        const progression = this.buildOpeningProgression(moveHistory, moveSequence);
        if (detectedOpening) {
            return {
                openingName: detectedOpening.name,
                openingDescription: detectedOpening.description,
                playerOpening: this.getPlayerOpeningType(moveHistory, 'white'),
                opponentDefense: this.getPlayerOpeningType(moveHistory, 'black'),
                suggestedMoves: detectedOpening.nextMoves || this.getGeneralSuggestions(moveHistory),
                strategyTips: detectedOpening.tips || this.getGeneralTips(moveHistory.length),
                isInBook: true,
                openingProgression: progression
            };
        }
        return {
            openingName: 'Out of Opening Book',
            openingDescription: 'The game has moved beyond known opening theory. Focus on general principles.',
            playerOpening: this.getPlayerOpeningType(moveHistory, 'white'),
            opponentDefense: this.getPlayerOpeningType(moveHistory, 'black'),
            suggestedMoves: this.getGeneralSuggestions(moveHistory),
            strategyTips: this.getGeneralTips(moveHistory.length),
            isInBook: false,
            openingProgression: progression
        };
    }
    /**
     * Build opening progression for first 5 moves
     */
    buildOpeningProgression(moveHistory, moveSequence) {
        const progression = [];
        const maxMoves = Math.min(10, moveHistory.length); // First 10 moves (5 for each side)
        for (let i = 1; i <= maxMoves; i++) {
            const partialSequence = moveSequence.slice(0, i);
            const opening = this.detectOpening(partialSequence);
            // Convert move to algebraic notation for display
            const move = moveHistory[i - 1];
            const fromFile = String.fromCharCode(97 + move.from.col);
            const fromRank = 8 - move.from.row;
            const toFile = String.fromCharCode(97 + move.to.col);
            const toRank = 8 - move.to.row;
            const movePlayed = `${toFile}${toRank}`;
            progression.push({
                moveNumber: i,
                openingName: opening ? opening.name : '',
                movePlayed: movePlayed
            });
        }
        return progression;
    }
    /**
     * Convert move history to algebraic notation for matching
     */
    convertMovesToNotation(moves) {
        return moves.map(move => {
            const fromFile = String.fromCharCode(97 + move.from.col);
            const fromRank = 8 - move.from.row;
            const toFile = String.fromCharCode(97 + move.to.col);
            const toRank = 8 - move.to.row;
            return `${fromFile}${fromRank}${toFile}${toRank}`;
        });
    }
    /**
     * Detect which opening is being played
     */
    detectOpening(moveSequence) {
        // Sort openings by length (longest first) to match most specific opening
        const sortedOpenings = [...this.openingsDatabase].sort((a, b) => b.moves.length - a.moves.length);
        for (const opening of sortedOpenings) {
            if (this.matchesOpening(moveSequence, opening.moves)) {
                return opening;
            }
        }
        return null;
    }
    /**
     * Check if move sequence matches an opening
     */
    matchesOpening(moveSequence, openingMoves) {
        if (moveSequence.length < openingMoves.length) {
            return false;
        }
        for (let i = 0; i < openingMoves.length; i++) {
            if (moveSequence[i] !== openingMoves[i]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get the type of opening a player is using
     */
    getPlayerOpeningType(moves, color) {
        const playerMoves = moves.filter(m => m.color === color);
        if (playerMoves.length === 0)
            return '-';
        const firstMove = playerMoves[0];
        const notation = this.convertMovesToNotation([firstMove])[0];
        // Determine opening type based on first move
        if (notation === 'e2e4')
            return 'King\'s Pawn (e4)';
        if (notation === 'd2d4')
            return 'Queen\'s Pawn (d4)';
        if (notation === 'c2c4')
            return 'English (c4)';
        if (notation === 'g1f3')
            return 'Reti (Nf3)';
        if (notation === 'e7e5' && playerMoves.length === 1)
            return 'Open Game (e5)';
        if (notation === 'c7c5' && playerMoves.length === 1)
            return 'Sicilian Defense';
        if (notation === 'e7e6' && playerMoves.length === 1)
            return 'French Defense';
        if (notation === 'c7c6' && playerMoves.length === 1)
            return 'Caro-Kann';
        if (notation === 'g8f6' && playerMoves.length === 1)
            return 'Indian Defense';
        if (notation === 'd7d5' && playerMoves.length === 1)
            return 'Closed Game (d5)';
        return 'Various';
    }
    /**
     * Get starting guidance before any moves
     */
    getStartingGuidance() {
        return {
            openingName: 'Game Start',
            openingDescription: 'Welcome! The most popular first moves are 1.e4, 1.d4, 1.Nf3, and 1.c4.',
            playerOpening: '-',
            opponentDefense: '-',
            suggestedMoves: ['e4 (King\'s Pawn)', 'd4 (Queen\'s Pawn)', 'Nf3 (Reti)', 'c4 (English)'],
            strategyTips: [
                'Control the center with pawns (e4, d4)',
                'Develop knights before bishops',
                'Castle early for king safety',
                'Don\'t move the same piece twice in opening',
                'Connect your rooks'
            ],
            isInBook: true,
            openingProgression: []
        };
    }
    /**
     * Get general move suggestions when out of book
     */
    getGeneralSuggestions(moveHistory) {
        const moveCount = moveHistory.length;
        if (moveCount < 6) {
            return [
                'Develop minor pieces (knights and bishops)',
                'Control the center',
                'Prepare to castle'
            ];
        }
        else if (moveCount < 12) {
            return [
                'Castle if you haven\'t already',
                'Connect your rooks',
                'Develop remaining pieces'
            ];
        }
        else {
            return [
                'Look for tactical opportunities',
                'Improve piece positions',
                'Create threats',
                'Consider pawn breaks'
            ];
        }
    }
    /**
     * Get general strategy tips based on game phase
     */
    getGeneralTips(moveCount) {
        if (moveCount < 6) {
            return [
                'Develop pieces quickly',
                'Control central squares',
                'Avoid moving same piece twice',
                'Castle early'
            ];
        }
        else if (moveCount < 15) {
            return [
                'Complete development',
                'Create piece harmony',
                'Look for tactical shots',
                'Improve worst-placed piece'
            ];
        }
        else {
            return [
                'Create and execute plans',
                'Look for pawn breaks',
                'Trade when advantageous',
                'Activate your pieces'
            ];
        }
    }
    /**
     * Get Stockfish analysis of current position
     */
    async getStockfishAnalysis(boardState, currentTurn, moveHistory) {
        try {
            const fen = this.stockfish.boardToFEN(boardState, currentTurn, moveHistory);
            const analysis = await this.stockfish.analyzePosition(fen, 15, 1000);
            return analysis;
        }
        catch (error) {
            console.error('Stockfish analysis error:', error);
            return null;
        }
    }
    /**
     * Get comprehensive analysis combining Stockfish + Opening Book + Claude
     */
    async analyzeLastMove(lastMove, moveHistory, boardState, currentTurn) {
        console.log('🔍 Starting analysis for move:', moveHistory.length);
        // ALWAYS get Stockfish analysis first (primary engine)
        const stockfishAnalysis = await this.getStockfishAnalysis(boardState, currentTurn, moveHistory);
        console.log('Stockfish analysis result:', stockfishAnalysis ? 'Success' : 'Failed');
        // If we have Stockfish moves, convert them to readable format
        let stockfishMoves = [];
        if (stockfishAnalysis && stockfishAnalysis.bestMoves.length > 0) {
            console.log('Converting', stockfishAnalysis.bestMoves.length, 'Stockfish moves to readable format');
            stockfishMoves = stockfishAnalysis.bestMoves.map(move => {
                const readable = this.stockfish.uciToAlgebraic(move.move, boardState);
                const evalStr = move.mate !== undefined
                    ? `M${move.mate > 0 ? '+' : ''}${move.mate}`
                    : `${(move.score / 100).toFixed(1)}`;
                return `${readable} (${evalStr})`;
            });
            console.log('Stockfish suggests:', stockfishMoves);
        }
        else {
            console.warn('⚠️ No Stockfish moves available');
        }
        // Get opening information if we're still in book
        const moveSequence = this.convertMovesToNotation(moveHistory);
        const detectedOpening = this.detectOpening(moveSequence);
        const openingContext = detectedOpening ? {
            name: detectedOpening.name,
            description: detectedOpening.description,
            theory: detectedOpening.tips?.join(' ') || ''
        } : null;
        // If Claude API is configured, get educational explanations
        if (this.claudeAPI.isConfigured()) {
            const response = await this.claudeAPI.analyzeMove(lastMove, moveHistory, boardState, currentTurn, stockfishAnalysis, openingContext);
            // Add Stockfish evaluation to response
            if (stockfishAnalysis) {
                response.evaluation = stockfishAnalysis.evaluation;
                if (stockfishAnalysis.bestMoves.length > 0 && stockfishAnalysis.bestMoves[0].mate !== undefined) {
                    response.mate = stockfishAnalysis.bestMoves[0].mate;
                }
            }
            return response;
        }
        // If no Claude API, return Stockfish-only analysis
        return {
            moveExplanation: openingContext
                ? `Playing in the ${openingContext.name}. ${openingContext.description}`
                : `Position evaluation: ${stockfishAnalysis ? (stockfishAnalysis.evaluation / 100).toFixed(1) : 'N/A'}`,
            tacticalAnalysis: stockfishAnalysis && stockfishAnalysis.bestMoves.length > 0
                ? `Stockfish suggests: ${stockfishMoves.slice(0, 3).join(', ')}`
                : 'Analyzing position...',
            strategicPlan: openingContext?.theory || 'Focus on piece development and king safety.',
            suggestedMoves: stockfishMoves,
            strategyTips: detectedOpening?.tips || [
                'Control the center',
                'Develop pieces quickly',
                'Castle early',
                'Connect your rooks'
            ],
            evaluation: stockfishAnalysis?.evaluation || 0,
            mate: stockfishAnalysis?.bestMoves[0]?.mate
        };
    }
}
//# sourceMappingURL=coach.js.map