import { DNA, GridCell, StoreType } from '../types';
export declare const DEFAULT_DNA: DNA;
export type RunSimulation = (dna: DNA, grid: GridCell[][]) => Promise<number>;
export declare const cloneGrid: (grid: GridCell[][]) => {
    commitsCount: number;
    color: string;
    level: import("../types").ContributionLevel;
}[][];
export declare const hasRemainingCells: (grid: GridCell[][]) => boolean;
export declare const calculateTournamentScore: (store: StoreType) => number;
export declare const clampDNA: (dna: DNA) => DNA;
export declare const ensureIntelligence: (store: StoreType) => import("../types").Intelligence;
export declare const evolveIntelligence: (store: StoreType, runSimulation: RunSimulation) => Promise<{
    winnerName: string;
    bestScore: number;
    benchmarkCount: number;
    populationSize: number;
}>;
