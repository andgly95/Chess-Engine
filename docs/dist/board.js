// Board state management
export function createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Place pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
        board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
    }
    // Place other pieces
    const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
        board[0][col] = { type: backRowPieces[col], color: 'black', hasMoved: false };
        board[7][col] = { type: backRowPieces[col], color: 'white', hasMoved: false };
    }
    return board;
}
export function copyBoard(board) {
    return board.map(row => row.map(piece => piece ? { ...piece } : null));
}
export function getPieceSymbol(piece) {
    if (!piece)
        return '';
    const symbols = {
        white: {
            pawn: '♙',
            knight: '♘',
            bishop: '♗',
            rook: '♖',
            queen: '♕',
            king: '♔'
        },
        black: {
            pawn: '♟',
            knight: '♞',
            bishop: '♝',
            rook: '♜',
            queen: '♛',
            king: '♚'
        }
    };
    return symbols[piece.color][piece.type];
}
export function positionToNotation(row, col) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rank = 8 - row;
    return `${files[col]}${rank}`;
}
export function notationToPosition(notation) {
    if (notation.length !== 2)
        return null;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const col = files.indexOf(notation[0]);
    const rank = parseInt(notation[1]);
    if (col === -1 || rank < 1 || rank > 8)
        return null;
    const row = 8 - rank;
    return { row, col };
}
//# sourceMappingURL=board.js.map