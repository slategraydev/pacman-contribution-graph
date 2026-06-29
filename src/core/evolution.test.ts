import { DNA, GridCell, StoreType } from '../types';
import { clampDNA, DEFAULT_DNA, evolveIntelligence } from './evolution';
import { GRID_HEIGHT, GRID_WIDTH } from './constants';

const makeGrid = (commitsCount: number): GridCell[][] => {
	const grid: GridCell[][] = Array.from({ length: GRID_WIDTH }, () =>
		Array.from({ length: GRID_HEIGHT }, () => ({ commitsCount: 0, color: '#000', level: 'NONE' }))
	);
	grid[0][0] = { commitsCount, color: 'green', level: commitsCount ? 'FIRST_QUARTILE' : 'NONE' };
	return grid;
};

const makeStore = (dna: DNA = DEFAULT_DNA): StoreType =>
	({
		frameCount: 0,
		contributions: [],
		pacman: {
			x: 0,
			y: 0,
			direction: 'right',
			points: 0,
			totalPoints: 0,
			dotsEaten: 0,
			ghostsEaten: 0,
			deadRemainingDuration: 0,
			pauseRemainingDuration: 0,
			powerupRemainingDuration: 0,
			recentPositions: [],
			lives: 3
		},
		ghosts: [],
		grid: makeGrid(1),
		monthLabels: [],
		pacmanMouthOpen: true,
		gameInterval: 0,
		gameHistory: [],
		config: {
			outputFormat: 'svg',
			gameSpeed: 1,
			runEvolution: true,
			svgCallback: jest.fn(),
			gameOverCallback: jest.fn(),
			pointsIncreasedCallback: jest.fn(),
			intelligence: {
				generation: 1,
				dna,
				lastScore: 0,
				benchmarks: [makeGrid(1), makeGrid(3)],
				population: [{ dna, score: 0 }],
				seed: 123
			}
		},
		useGithubThemeColor: true,
		gameEnded: false
	}) as unknown as StoreType;

describe('evolveIntelligence', () => {
	it('scores DNA by average across benchmark grids', async () => {
		const dna = { ...DEFAULT_DNA, safetyWeight: 10 };
		const store = makeStore(dna);

		await evolveIntelligence(store, async (candidate, grid) => candidate.safetyWeight * grid[0][0].commitsCount);

		expect(store.config.intelligence?.lastScore).toBe(20);
	});

	it('retains the best elite DNA after evolution', async () => {
		const dna = { ...DEFAULT_DNA, safetyWeight: 10 };
		const store = makeStore(dna);

		await evolveIntelligence(store, async (candidate) => candidate.safetyWeight);

		expect(store.config.intelligence?.dna.safetyWeight).toBe(10);
		expect(store.config.intelligence?.population?.[0].score).toBe(10);
	});

	it('clamps mutated DNA fields to sane bounds', () => {
		const clamped = clampDNA({
			safetyWeight: 100,
			pointWeight: -1,
			dangerRadius: 200,
			revisitPenalty: -10,
			scaredGhostWeight: 999
		});

		expect(clamped).toEqual({
			safetyWeight: 10,
			pointWeight: 0.1,
			dangerRadius: 20,
			revisitPenalty: 0,
			scaredGhostWeight: 20
		});
	});

	it('replays the same generation from the same seed', async () => {
		const a = makeStore();
		const b = makeStore();
		const score = async (dna: DNA) =>
			dna.safetyWeight * 10 + dna.pointWeight * 5 + dna.dangerRadius + dna.scaredGhostWeight - dna.revisitPenalty / 100;

		await evolveIntelligence(a, score);
		await evolveIntelligence(b, score);

		expect(a.config.intelligence?.seed).toBe(b.config.intelligence?.seed);
		expect(a.config.intelligence?.dna).toEqual(b.config.intelligence?.dna);
		expect(a.config.intelligence?.population).toEqual(b.config.intelligence?.population);
	});
});
