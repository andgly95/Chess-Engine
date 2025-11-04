import { ChessGame } from './game.js';
export declare class ChessUI {
    private game;
    private boardElement;
    private statusElement;
    private historyElement;
    private selectedSquare;
    private validMoves;
    constructor(game: ChessGame);
    private setupEventListeners;
    render(): void;
    private renderBoard;
    private handleSquareClick;
    private renderStatus;
    private renderMoveHistory;
    private moveToNotation;
}
