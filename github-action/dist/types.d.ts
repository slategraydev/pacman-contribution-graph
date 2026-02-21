export type Point2d = {
    x: number;
    y: number;
    direction?: 'right' | 'left' | 'up' | 'down';
    value?: number;
};
export type ContributionLevel = 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';
export interface Contribution {
    date: Date;
    count: number;
    color: string;
    level: ContributionLevel;
}
export declare enum PlayerStyle {
    CONSERVATIVE = "conservative",
    AGGRESSIVE = "aggressive",
    OPPORTUNISTIC = "opportunistic"
}
export interface Pacman {
    x: number;
    y: number;
    direction: 'right' | 'left' | 'up' | 'down';
    points: number;
    totalPoints: number;
    deadRemainingDuration: number;
    pauseRemainingDuration: number;
    powerupRemainingDuration: number;
    recentPositions: string[];
    target?: Point2d;
    lives: number;
}
export type GhostName = 'blinky' | 'clyde' | 'inky' | 'pinky' | 'eyes';
export interface Ghost {
    x: number;
    y: number;
    name: GhostName;
    originalName?: GhostName;
    scared: boolean;
    direction: 'right' | 'left' | 'up' | 'down';
    target?: Point2d;
    inHouse: boolean;
    respawning?: boolean;
    respawnCounter: number;
    freezeCounter: number;
    deathPauseDuration: number;
    justReleasedFromHouse: boolean;
}
export interface GridCell {
    commitsCount: number;
    color: string;
    level: ContributionLevel;
}
export interface StoreType {
    frameCount: number;
    contributions: Contribution[];
    pacman: Pacman;
    ghosts: Ghost[];
    grid: GridCell[][];
    monthLabels: string[];
    pacmanMouthOpen: boolean;
    gameInterval: number;
    gameHistory: {
        pacman: Pacman;
        ghosts: Ghost[];
        grid: GridCell[][];
    }[];
    config: Config;
    useGithubThemeColor: boolean;
    gameEnded: boolean;
}
export interface DNA {
    safetyWeight: number;
    pointWeight: number;
    dangerRadius: number;
    revisitPenalty: number;
    scaredGhostWeight: number;
}
export interface Intelligence {
    generation: number;
    dna: DNA;
    lastScore: number;
}
export interface Config {
    platform: 'github' | 'gitlab';
    username: string;
    canvas: HTMLCanvasElement;
    outputFormat: 'canvas' | 'svg';
    svgCallback: (blobUrl: string) => void;
    gameOverCallback: () => void;
    gameTheme: ThemeKeys;
    gameSpeed: number;
    enableSounds: boolean;
    pointsIncreasedCallback: (pointsSum: number) => void;
    githubSettings?: {
        accessToken: string;
    };
    maxFrames?: number;
    maxHistorySize?: number;
    intelligence?: Intelligence;
    runEvolution?: boolean;
}
export type ThemeKeys = 'github' | 'github-dark' | 'gitlab' | 'gitlab-dark';
export interface GameTheme {
    textColor: string;
    gridBackground: string;
    wallColor: string;
    intensityColors: string[];
}
export interface AnimationData {
    keyTimes: string;
    values: string;
}
