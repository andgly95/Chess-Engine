// Chess Coach - Opening detection and move suggestions
export class ChessCoach {
    constructor() {
        this.openingsDatabase = [
            // King's Pawn Openings (e4)
            {
                name: 'King\'s Pawn Opening',
                moves: ['e2e4'],
                description: 'The most popular opening. Controls the center and frees the queen and bishop.',
                category: 'e4',
                nextMoves: ['e5', 'c5', 'e6', 'c6', 'd6'],
                tips: ['Control the center', 'Develop pieces quickly', 'Castle early']
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
                name: 'Spanish Opening (Ruy Lopez)',
                moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
                description: 'One of the oldest and most respected openings. Puts pressure on the center.',
                category: 'e4',
                nextMoves: ['a6', 'Nf6', 'f6'],
                tips: ['Maintain central pressure', 'Be ready to castle', 'Prepare d4 advance']
            },
            {
                name: 'Sicilian Defense',
                moves: ['e2e4', 'c7c5'],
                description: 'The most popular defense to 1.e4. Black fights for the center asymmetrically.',
                category: 'e4',
                nextMoves: ['Nf3', 'd4', 'Nc3'],
                tips: ['Complex positions ahead', 'Black gets queenside pawn majority', 'Sharp tactical play']
            },
            {
                name: 'French Defense',
                moves: ['e2e4', 'e7e6'],
                description: 'Solid defense that creates a strong pawn chain.',
                category: 'e4',
                nextMoves: ['d4', 'Nf3', 'Nc3'],
                tips: ['Black will play d5', 'Closed position typical', 'Long-term strategic play']
            },
            {
                name: 'Caro-Kann Defense',
                moves: ['e2e4', 'c7c6'],
                description: 'Solid defense where Black prepares d5 without blocking the light bishop.',
                category: 'e4',
                nextMoves: ['d4', 'Nc3', 'Nf3'],
                tips: ['Similar to French but bishop freer', 'Solid and reliable', 'Less sharp than Sicilian']
            },
            // Queen's Pawn Openings (d4)
            {
                name: 'Queen\'s Pawn Opening',
                moves: ['d2d4'],
                description: 'Solid opening controlling the center. Leads to strategic positions.',
                category: 'd4',
                nextMoves: ['d5', 'Nf6', 'f5', 'e6'],
                tips: ['Control center', 'Develop knights first', 'Prepare c4']
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
            // Other Openings
            {
                name: 'English Opening',
                moves: ['c2c4'],
                description: 'Flexible opening that can transpose to many structures.',
                category: 'flank',
                nextMoves: ['e5', 'Nf6', 'e6', 'c5'],
                tips: ['Very flexible', 'Reverse Sicilian if Black plays e5', 'Control center from flank']
            },
            {
                name: 'Reti Opening',
                moves: ['g1f3'],
                description: 'Hypermodern opening delaying central pawn moves.',
                category: 'flank',
                nextMoves: ['d5', 'Nf6', 'e5'],
                tips: ['Very flexible', 'Control center with pieces', 'Can transpose to d4 or c4 systems']
            }
        ];
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
        if (detectedOpening) {
            return {
                openingName: detectedOpening.name,
                openingDescription: detectedOpening.description,
                playerOpening: this.getPlayerOpeningType(moveHistory, 'white'),
                opponentDefense: this.getPlayerOpeningType(moveHistory, 'black'),
                suggestedMoves: detectedOpening.nextMoves || this.getGeneralSuggestions(moveHistory),
                strategyTips: detectedOpening.tips || this.getGeneralTips(moveHistory.length),
                isInBook: true
            };
        }
        return {
            openingName: 'Out of Opening Book',
            openingDescription: 'The game has moved beyond known opening theory. Focus on general principles.',
            playerOpening: this.getPlayerOpeningType(moveHistory, 'white'),
            opponentDefense: this.getPlayerOpeningType(moveHistory, 'black'),
            suggestedMoves: this.getGeneralSuggestions(moveHistory),
            strategyTips: this.getGeneralTips(moveHistory.length),
            isInBook: false
        };
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
            isInBook: true
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
     * Placeholder for Claude AI integration
     * This will be connected to Claude API for advanced analysis
     */
    async getClaudeAnalysis(moveHistory, position) {
        // TODO: Integrate with Claude API
        // This is where we'll send the position to Claude for deep analysis
        return 'Claude AI analysis will be integrated here';
    }
}
//# sourceMappingURL=coach.js.map