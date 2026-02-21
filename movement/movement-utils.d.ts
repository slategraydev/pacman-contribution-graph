import { Point2d } from '../types';
export declare const MovementUtils: {
    getValidMoves: (x: number, y: number, isGhost?: boolean, isReturning?: boolean) => [
        number,
        number
    ][];
    calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
    /**
     * Dijkstra's 4-way grid.
     * Returns the NEXT step (not the entire route) or null if none.
     */
    findNextStepDijkstra(start: Point2d, target: Point2d, isReturning?: boolean): Point2d | null;
};
