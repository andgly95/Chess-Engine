// Piece movement logic and rules
export function getValidMoves(board, position, checkForCheck = true) {
    const piece = board[position.row][position.col];
    if (!piece)
        return [];
    let moves = [];
    switch (piece.type) {
        case 'pawn':
            moves = getPawnMoves(board, position, piece.color);
            break;
        case 'knight':
            moves = getKnightMoves(board, position, piece.color);
            break;
        case 'bishop':
            moves = getBishopMoves(board, position, piece.color);
            break;
        case 'rook':
            moves = getRookMoves(board, position, piece.color);
            break;
        case 'queen':
            moves = getQueenMoves(board, position, piece.color);
            break;
        case 'king':
            moves = getKingMoves(board, position, piece.color);
            break;
    }
    // Filter out moves that would put own king in check
    if (checkForCheck) {
        moves = moves.filter(move => !wouldMoveResultInCheck(board, position, move, piece.color));
    }
    return moves;
}
function getPawnMoves(board, pos, color) {
    const moves = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    // Move forward one square
    const oneForward = { row: pos.row + direction, col: pos.col };
    if (isValidPosition(oneForward) && !board[oneForward.row][oneForward.col]) {
        moves.push(oneForward);
        // Move forward two squares from starting position
        if (pos.row === startRow) {
            const twoForward = { row: pos.row + direction * 2, col: pos.col };
            if (!board[twoForward.row][twoForward.col]) {
                moves.push(twoForward);
            }
        }
    }
    // Capture diagonally
    const captureOffsets = [-1, 1];
    for (const offset of captureOffsets) {
        const capturePos = { row: pos.row + direction, col: pos.col + offset };
        if (isValidPosition(capturePos)) {
            const targetPiece = board[capturePos.row][capturePos.col];
            if (targetPiece && targetPiece.color !== color) {
                moves.push(capturePos);
            }
            // En passant
            const adjacentPos = { row: pos.row, col: pos.col + offset };
            if (isValidPosition(adjacentPos)) {
                const adjacentPiece = board[adjacentPos.row][adjacentPos.col];
                if (adjacentPiece &&
                    adjacentPiece.type === 'pawn' &&
                    adjacentPiece.color !== color) {
                    // Would need to check move history for en passant eligibility
                    // For now, we'll handle this in the game logic
                }
            }
        }
    }
    return moves;
}
function getKnightMoves(board, pos, color) {
    const moves = [];
    const offsets = [
        { row: -2, col: -1 }, { row: -2, col: 1 },
        { row: -1, col: -2 }, { row: -1, col: 2 },
        { row: 1, col: -2 }, { row: 1, col: 2 },
        { row: 2, col: -1 }, { row: 2, col: 1 }
    ];
    for (const offset of offsets) {
        const newPos = { row: pos.row + offset.row, col: pos.col + offset.col };
        if (isValidPosition(newPos)) {
            const targetPiece = board[newPos.row][newPos.col];
            if (!targetPiece || targetPiece.color !== color) {
                moves.push(newPos);
            }
        }
    }
    return moves;
}
function getBishopMoves(board, pos, color) {
    const moves = [];
    const directions = [
        { row: -1, col: -1 }, { row: -1, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 1 }
    ];
    for (const dir of directions) {
        let newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
        while (isValidPosition(newPos)) {
            const targetPiece = board[newPos.row][newPos.col];
            if (!targetPiece) {
                moves.push(newPos);
            }
            else {
                if (targetPiece.color !== color) {
                    moves.push(newPos);
                }
                break;
            }
            newPos = { row: newPos.row + dir.row, col: newPos.col + dir.col };
        }
    }
    return moves;
}
function getRookMoves(board, pos, color) {
    const moves = [];
    const directions = [
        { row: -1, col: 0 }, { row: 1, col: 0 },
        { row: 0, col: -1 }, { row: 0, col: 1 }
    ];
    for (const dir of directions) {
        let newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
        while (isValidPosition(newPos)) {
            const targetPiece = board[newPos.row][newPos.col];
            if (!targetPiece) {
                moves.push(newPos);
            }
            else {
                if (targetPiece.color !== color) {
                    moves.push(newPos);
                }
                break;
            }
            newPos = { row: newPos.row + dir.row, col: newPos.col + dir.col };
        }
    }
    return moves;
}
function getQueenMoves(board, pos, color) {
    // Queen moves are combination of rook and bishop moves
    return [...getRookMoves(board, pos, color), ...getBishopMoves(board, pos, color)];
}
function getKingMoves(board, pos, color) {
    const moves = [];
    const offsets = [
        { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
        { row: 0, col: -1 }, { row: 0, col: 1 },
        { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
    ];
    for (const offset of offsets) {
        const newPos = { row: pos.row + offset.row, col: pos.col + offset.col };
        if (isValidPosition(newPos)) {
            const targetPiece = board[newPos.row][newPos.col];
            if (!targetPiece || targetPiece.color !== color) {
                moves.push(newPos);
            }
        }
    }
    // Castling is handled separately in game logic
    return moves;
}
export function isValidPosition(pos) {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}
export function wouldMoveResultInCheck(board, from, to, color) {
    // Create a copy of the board with the move applied
    const testBoard = board.map(row => row.slice());
    const piece = testBoard[from.row][from.col];
    testBoard[to.row][to.col] = piece;
    testBoard[from.row][from.col] = null;
    return isKingInCheck(testBoard, color);
}
export function isKingInCheck(board, color) {
    // Find the king
    let kingPos = null;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === 'king' && piece.color === color) {
                kingPos = { row, col };
                break;
            }
        }
        if (kingPos)
            break;
    }
    if (!kingPos)
        return false;
    // Check if any opponent piece can attack the king
    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === opponentColor) {
                const moves = getValidMoves(board, { row, col }, false);
                if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}
export function findKing(board, color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === 'king' && piece.color === color) {
                return { row, col };
            }
        }
    }
    return null;
}
export function canCastle(board, color, side) {
    const row = color === 'white' ? 7 : 0;
    const king = board[row][4];
    // King must be in starting position and hasn't moved
    if (!king || king.type !== 'king' || king.hasMoved) {
        return false;
    }
    const rookCol = side === 'kingside' ? 7 : 0;
    const rook = board[row][rookCol];
    // Rook must be in starting position and hasn't moved
    if (!rook || rook.type !== 'rook' || rook.hasMoved) {
        return false;
    }
    // Squares between king and rook must be empty
    const startCol = side === 'kingside' ? 5 : 1;
    const endCol = side === 'kingside' ? 7 : 4;
    for (let col = startCol; col < endCol; col++) {
        if (board[row][col]) {
            return false;
        }
    }
    // King cannot be in check
    if (isKingInCheck(board, color)) {
        return false;
    }
    // King cannot move through check
    const kingDestCol = side === 'kingside' ? 6 : 2;
    const throughCol = side === 'kingside' ? 5 : 3;
    if (wouldMoveResultInCheck(board, { row, col: 4 }, { row, col: throughCol }, color)) {
        return false;
    }
    if (wouldMoveResultInCheck(board, { row, col: 4 }, { row, col: kingDestCol }, color)) {
        return false;
    }
    return true;
}
//# sourceMappingURL=piece.js.map