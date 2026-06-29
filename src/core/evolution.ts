import { DNA, EvolutionCandidate, GridCell, StoreType } from '../types';

export const DEFAULT_DNA: DNA = { safetyWeight: 1.5, pointWeight: 0.8, dangerRadius: 7, revisitPenalty: 100, scaredGhostWeight: 3.0 };

const POPULATION_SIZE = 5;
const COMPETITOR_COUNT = 100;
const MAX_BENCHMARKS = 5;

const DNA_BOUNDS = {
	safetyWeight: [0.1, 10],
	pointWeight: [0.1, 10],
	dangerRadius: [2, 20],
	revisitPenalty: [0, 500],
	scaredGhostWeight: [0.1, 20]
} as const;

type Candidate = EvolutionCandidate & { name: string };
type Random = () => number;

export type RunSimulation = (dna: DNA, grid: GridCell[][]) => Promise<number>;

export const cloneGrid = (grid: GridCell[][]) => grid.map((row) => row.map((cell) => ({ ...cell })));

export const hasRemainingCells = (grid: GridCell[][]) => grid.some((row) => row.some((cell) => cell.commitsCount > 0));

export const calculateTournamentScore = (store: StoreType) => {
	const commitsValue = store.pacman.totalPoints;
	const dotsValue = store.pacman.dotsEaten * 10;
	const huntValue = store.pacman.ghostsEaten * 200;
	const survivalValue = store.pacman.lives * 100;
	let score = ((commitsValue + dotsValue + huntValue + survivalValue) / (store.frameCount || 1)) * 1000;

	if (!hasRemainingCells(store.grid)) {
		score *= 2.0;
	}

	return score;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampDNA = (dna: DNA): DNA => ({
	safetyWeight: clamp(dna.safetyWeight || DEFAULT_DNA.safetyWeight, DNA_BOUNDS.safetyWeight[0], DNA_BOUNDS.safetyWeight[1]),
	pointWeight: clamp(dna.pointWeight || DEFAULT_DNA.pointWeight, DNA_BOUNDS.pointWeight[0], DNA_BOUNDS.pointWeight[1]),
	dangerRadius: Math.round(clamp(dna.dangerRadius || DEFAULT_DNA.dangerRadius, DNA_BOUNDS.dangerRadius[0], DNA_BOUNDS.dangerRadius[1])),
	revisitPenalty: clamp(dna.revisitPenalty || DEFAULT_DNA.revisitPenalty, DNA_BOUNDS.revisitPenalty[0], DNA_BOUNDS.revisitPenalty[1]),
	scaredGhostWeight: clamp(
		dna.scaredGhostWeight || DEFAULT_DNA.scaredGhostWeight,
		DNA_BOUNDS.scaredGhostWeight[0],
		DNA_BOUNDS.scaredGhostWeight[1]
	)
});

const sameGrid = (a: GridCell[][], b: GridCell[][]) => JSON.stringify(a) === JSON.stringify(b);

const createRandom = (startSeed: number) => {
	let seed = (startSeed || 1) >>> 0;
	const random = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 4294967296;
	};
	return { random, getSeed: () => seed };
};

const mutateValue = (value: number, intensity: number, random: Random) => value * (1 + (random() * 2 - 1) * intensity);

const mutateDNA = (dna: DNA, intensity: number, random: Random): DNA =>
	clampDNA({
		safetyWeight: mutateValue(dna.safetyWeight, intensity, random),
		pointWeight: mutateValue(dna.pointWeight, intensity, random),
		dangerRadius: mutateValue(dna.dangerRadius, intensity, random),
		revisitPenalty: mutateValue(dna.revisitPenalty, intensity, random),
		scaredGhostWeight: mutateValue(dna.scaredGhostWeight, intensity, random)
	});

const crossoverDNA = (a: DNA, b: DNA, random: Random): DNA =>
	clampDNA({
		safetyWeight: random() < 0.5 ? a.safetyWeight : b.safetyWeight,
		pointWeight: random() < 0.5 ? a.pointWeight : b.pointWeight,
		dangerRadius: random() < 0.5 ? a.dangerRadius : b.dangerRadius,
		revisitPenalty: random() < 0.5 ? a.revisitPenalty : b.revisitPenalty,
		scaredGhostWeight: random() < 0.5 ? a.scaredGhostWeight : b.scaredGhostWeight
	});

export const ensureIntelligence = (store: StoreType) => {
	if (!store.config.intelligence) {
		store.config.intelligence = {
			generation: 1,
			dna: { ...DEFAULT_DNA },
			lastScore: 0,
			benchmarks: [],
			population: [],
			seed: 1
		};
	}

	const intelligence = store.config.intelligence;
	intelligence.dna = clampDNA({ ...DEFAULT_DNA, ...intelligence.dna });
	intelligence.lastScore ||= 0;
	intelligence.seed ||= intelligence.generation || 1;

	const migratedBenchmarks = intelligence.benchmarks?.length
		? intelligence.benchmarks
		: intelligence.benchmarkGrid
			? [intelligence.benchmarkGrid]
			: [];

	intelligence.benchmarks = migratedBenchmarks.map(cloneGrid).filter(hasRemainingCells).slice(0, MAX_BENCHMARKS);
	if (hasRemainingCells(store.grid) && intelligence.benchmarks.length < MAX_BENCHMARKS) {
		const currentGrid = cloneGrid(store.grid);
		if (!intelligence.benchmarks.some((benchmark) => sameGrid(benchmark, currentGrid))) {
			intelligence.benchmarks.push(currentGrid);
		}
	}
	intelligence.benchmarkGrid = intelligence.benchmarks[0];

	intelligence.population = (intelligence.population?.length ? intelligence.population : [{ dna: intelligence.dna, score: intelligence.lastScore }])
		.map((candidate) => ({ dna: clampDNA({ ...DEFAULT_DNA, ...candidate.dna }), score: candidate.score || 0 }))
		.sort((a, b) => b.score - a.score)
		.slice(0, POPULATION_SIZE);

	return intelligence;
};

const buildCompetitors = (store: StoreType, random: Random): Candidate[] => {
	const intelligence = ensureIntelligence(store);
	const elites = intelligence.population?.length ? intelligence.population : [{ dna: intelligence.dna, score: intelligence.lastScore }];
	const competitors: Candidate[] = elites.map((candidate, index) => ({ name: `Elite ${index + 1}`, dna: candidate.dna, score: 0 }));

	while (competitors.length < COMPETITOR_COUNT) {
		const parentA = elites[Math.floor(random() * elites.length)].dna;
		const parentB = elites[Math.floor(random() * elites.length)].dna;
		const base = elites.length > 1 ? crossoverDNA(parentA, parentB, random) : parentA;
		const intensity = random() < 0.15 ? 0.4 : 0.1;
		competitors.push({
			name: `Offspring ${competitors.length}`,
			dna: mutateDNA(base, intensity, random),
			score: 0
		});
	}

	return competitors;
};

const scoreDNA = async (dna: DNA, benchmarks: GridCell[][][], runSimulation: RunSimulation) => {
	let total = 0;
	for (const benchmark of benchmarks) {
		total += await runSimulation(dna, cloneGrid(benchmark));
	}
	return total / benchmarks.length;
};

export const evolveIntelligence = async (store: StoreType, runSimulation: RunSimulation) => {
	const intelligence = ensureIntelligence(store);
	intelligence.generation++;

	if (!intelligence.benchmarks?.length) {
		return { winnerName: 'None', bestScore: intelligence.lastScore, benchmarkCount: 0, populationSize: intelligence.population?.length || 0 };
	}

	const previousBestScore = intelligence.lastScore || 0;
	const randomState = createRandom(intelligence.seed || intelligence.generation);
	const competitors = buildCompetitors(store, randomState.random);
	const scored: Candidate[] = [];

	for (const competitor of competitors) {
		scored.push({
			...competitor,
			score: await scoreDNA(competitor.dna, intelligence.benchmarks, runSimulation)
		});
	}

	scored.sort((a, b) => b.score - a.score);
	const winner = scored[0];
	intelligence.population = scored.slice(0, POPULATION_SIZE).map(({ dna, score }) => ({ dna, score }));
	intelligence.dna = winner.dna;
	intelligence.lastScore = Math.max(previousBestScore, winner.score);
	intelligence.seed = randomState.getSeed();

	return {
		winnerName: winner.name,
		bestScore: winner.score,
		benchmarkCount: intelligence.benchmarks.length,
		populationSize: intelligence.population.length
	};
};
