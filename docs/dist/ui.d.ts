import { ChessGame } from './game.js';
export declare class ChessUI {
    private game;
    private boardElement;
    private statusElement;
    private historyElement;
    private promotionModal;
    private selectedSquare;
    private validMoves;
    private ai;
    private isAIMode;
    private playerColor;
    private isAIThinking;
    constructor(game: ChessGame);
    private setupEventListeners;
    render(): void;
    private renderBoard;
    private handleSquareClick;
    private renderStatus;
    private renderMoveHistory;
    private moveToNotation;
    private showPromotionModal;
    private hidePromotionModal;
    private handlePromotionChoice;
    private checkAIMove;
    private makeAIMove;
}
