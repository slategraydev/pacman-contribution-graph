import { GhostName, StoreType } from '../types';
export declare const determineGhostName: (index: number) => GhostName;
export declare const updateGame: (store: StoreType, forceFinish?: boolean, headless?: boolean) => Promise<void>;
export declare const Game: {
    startGame: (store: StoreType) => Promise<void>;
    stopGame: (store: StoreType) => Promise<void>;
};
