import { GhostsMovement } from '../movement/ghosts-movement';
import { PacmanMovement } from '../movement/pacman-movement';
import { MusicPlayer, Sound } from '../music-player';
import { Canvas } from '../renderers/canvas';
import { SVG } from '../renderers/svg';
import { GhostName, PlayerStyle, StoreType } from '../types';
import { Utils } from '../utils/utils';
import { DELTA_TIME, PACMAN_DEATH_DURATION, PACMAN_EAT_GHOST_PAUSE_DURATION } from './constants';

/* ---------- positioning helpers ---------- */

const placePacman = (store: StoreType) => {
	store.pacman = {
		x: 26,
		y: 5,
		direction: 'right',
		points: 0,
		totalPoints: 0,
		deadRemainingDuration: 0,
		pauseRemainingDuration: 0,
		powerupRemainingDuration: 0,
		recentPositions: [],
		lives: 3
	};
};

const placeGhosts = (store: StoreType) => {
	GhostsMovement.resetMovement();
	store.ghosts = [
		{
			x: 26,
			y: 2, // Blinky: (27, 3) -> (26, 2)
			name: 'blinky',
			direction: 'left',
			scared: false,
			target: undefined,
			inHouse: false,
			respawnCounter: 0,
			freezeCounter: 0,
			deathPauseDuration: 0,
			justReleasedFromHouse: false
		},
		{
			x: 25,
			y: 4, // Pinky: (26, 5) -> (25, 4)
			name: 'pinky',
			direction: 'up',
			scared: false,
			target: undefined,
			inHouse: true,
			respawnCounter: 0,
			freezeCounter: 25,
			deathPauseDuration: 0,
			justReleasedFromHouse: false
		},
		{
			x: 26,
			y: 4, // Inky: (27, 5) -> (26, 4)
			name: 'inky',
			direction: 'down',
			scared: false,
			target: undefined,
			inHouse: true,
			respawnCounter: 0,
			freezeCounter: 75,
			deathPauseDuration: 0,
			justReleasedFromHouse: false
		},
		{
			x: 27,
			y: 4, // Clyde: (28, 5) -> (27, 4)
			name: 'clyde',
			direction: 'up',
			scared: false,
			target: undefined,
			inHouse: true,
			respawnCounter: 0,
			freezeCounter: 150,
			deathPauseDuration: 0,
			justReleasedFromHouse: false
		}
	];

	// reset extras
	store.ghosts.forEach((g) => {
		g.justReleasedFromHouse = false;
		g.respawnCounter = 0;

		// Set different directions to create an asynchronous motion effect
		if (g.inHouse) {
			// Distribute the initial directions so that everyone is not synchronized
			if (g.name === 'inky') g.direction = 'up';
			else if (g.name === 'pinky') g.direction = 'down';
			else if (g.name === 'clyde') g.direction = 'up';
		}
	});
};

/* ---------- main cycle ---------- */

const stopGame = async (store: StoreType) => {
	clearInterval(store.gameInterval as number);
};

const startGame = async (store: StoreType) => {
	// Initialize intelligence if missing
	if (!store.config.intelligence) {
		store.config.intelligence = {
			generation: 1,
			dna: { safetyWeight: 1.5, pointWeight: 0.8, dangerRadius: 7, revisitPenalty: 100, scaredGhostWeight: 3.0 },
			lastFitness: 0
		};
	}

	const remainingCells = () => store.grid.some((row) => row.some((cell) => cell.commitsCount > 0));

	// --- THE DAILY TOURNAMENT (Evolutionary Step) ---
	if (store.config.runEvolution && store.config.outputFormat === 'svg') {
		// Increment generation every day the action runs
		store.config.intelligence.generation++;

		if (remainingCells()) {
			const originalDNA = { ...store.config.intelligence.dna };

			// Helper to apply a random drift of ±10% to a value
			const mutate = (val: number, intensity = 0.1) => {
				const drift = 1 + (Math.random() * intensity * 2 - intensity);
				return val * drift;
			};

			// Define Mutations: Generate 10 competitors (Baseline + 9 Mutations)
			const competitors = [{ name: 'Baseline', dna: { ...originalDNA } }];
			for (let i = 0; i < 9; i++) {
				competitors.push({
					name: `Offspring ${String.fromCharCode(65 + i)}`,
					dna: {
						safetyWeight: mutate(originalDNA.safetyWeight),
						pointWeight: mutate(originalDNA.pointWeight),
						dangerRadius: Math.max(2, Math.round(mutate(originalDNA.dangerRadius))),
						revisitPenalty: mutate(originalDNA.revisitPenalty),
						scaredGhostWeight: mutate(originalDNA.scaredGhostWeight)
					}
				});
			}

			let bestFitness = -1;
			let winnerDNA = originalDNA;
			let bestHistory: any[] = [];

			for (const competitor of competitors) {
				// Deep clone store for sandbox run, but preserve functions in config
				const sandboxStore: StoreType = JSON.parse(JSON.stringify(store));
				sandboxStore.config = {
					...store.config,
					intelligence: {
						...store.config.intelligence!,
						dna: competitor.dna
					}
				};
				sandboxStore.grid = store.grid.map((row) => row.map((cell) => ({ ...cell })));

				placePacman(sandboxStore);
				placeGhosts(sandboxStore);

				// Run Headless Simulation
				const MAX_FRAMES = 5000;
				while (!sandboxStore.gameEnded && sandboxStore.frameCount < MAX_FRAMES) {
					await updateGame(sandboxStore, false, true); // true = headless
				}

				// Calculate Fitness: (Total Dots Eaten / Total Frames) * 1000
				const dotsEaten = sandboxStore.pacman.totalPoints;
				const fitness = (dotsEaten / (sandboxStore.frameCount || 1)) * 1000;

				if (fitness > bestFitness) {
					bestFitness = fitness;
					winnerDNA = competitor.dna;
					bestHistory = sandboxStore.gameHistory;
				}
			}

			// Update Intelligence with the winner
			store.config.intelligence.dna = winnerDNA;
			store.config.intelligence.lastFitness = bestFitness;

			// REUSE the best history for the final SVG output to save CPU time
			store.gameHistory = bestHistory;
			store.gameEnded = true;

			const svg = SVG.generateAnimatedSVG(store);
			store.config.svgCallback(svg);
			store.config.gameOverCallback();
			return;
		}
	}

	// --- FINAL RENDERING RUN ---
	if (store.config.outputFormat == 'canvas') {
		store.config.canvas = store.config.canvas;
		Canvas.resizeCanvas(store);
		Canvas.listenToSoundController(store);
	}

	store.frameCount = 0;
	store.gameHistory = []; // keeps clean
	store.ghosts.forEach((g) => (g.scared = false));

	store.grid = Utils.createGridFromData(store);

	if (remainingCells()) {
		placePacman(store);
		placeGhosts(store);
	}

	// Capture initial state so gameHistory is never empty
	pushSnapshot(store, true);

	if (store.config.outputFormat == 'canvas') Canvas.drawGrid(store);

	if (store.config.outputFormat == 'canvas') {
		if (!store.config.enableSounds) {
			MusicPlayer.getInstance().mute();
		}
		await MusicPlayer.getInstance().preloadSounds();
		MusicPlayer.getInstance().startDefaultSound();
		await MusicPlayer.getInstance().play(Sound.BEGINNING);
	}

	if (store.config.outputFormat === 'svg') {
		const MAX_FRAMES = 5000; // Hard limit to prevent OOM
		while (!store.gameEnded && remainingCells() && store.frameCount < MAX_FRAMES) {
			await updateGame(store);
		}
		// snapshot final and force completion if we hit the limit
		if (!store.gameEnded) {
			await updateGame(store, store.frameCount >= MAX_FRAMES);
		}
	} else {
		clearInterval(store.gameInterval as number);
		store.gameInterval = setInterval(() => {
			if (!store.gameEnded) {
				updateGame(store);
			} else {
				clearInterval(store.gameInterval as number);
			}
		}, DELTA_TIME * store.config.gameSpeed) as unknown as number;
	}
};

/* ---------- utilities ---------- */

const resetPacman = (store: StoreType) => {
	store.pacman.x = 26;
	store.pacman.y = 5;
	store.pacman.direction = 'right';
	store.pacman.points = 0;
	store.pacman.powerupRemainingDuration = 0;
	store.pacman.pauseRemainingDuration = 0;
	store.pacman.target = undefined;
	store.pacman.recentPositions = [];
};

export const determineGhostName = (index: number): GhostName => {
	const names: GhostName[] = ['blinky', 'inky', 'pinky', 'clyde'];
	return names[index % names.length];
};

/* ---------- update per frame ---------- */

export const updateGame = async (store: StoreType, forceFinish = false, headless = false) => {
	/* -------- pacman timers (DEATH PAUSE) -------- */
	if (store.pacman.deadRemainingDuration > 0) {
		store.pacman.deadRemainingDuration--;

		if (store.pacman.deadRemainingDuration === 0) {
			store.pacman.lives--;
			if (store.pacman.lives > 0) {
				resetPacman(store);
				placeGhosts(store);
			} else {
				// GAME OVER - Generate SVG and end game
				store.gameEnded = true;

				if (headless) return;

				if (store.config.outputFormat === 'svg') {
					const svg = SVG.generateAnimatedSVG(store);
					store.config.svgCallback(svg);
				}
				if (store.config.outputFormat == 'canvas') {
					Canvas.renderGameOver(store);
					MusicPlayer.getInstance()
						.play(Sound.BEGINNING)
						.then(() => MusicPlayer.getInstance().stopDefaultSound());
				}
				store.config.gameOverCallback();
				return;
			}
		}

		if (headless) return;

		// Snapshot and render the current (dead or reset) state, then pause logic
		pushSnapshot(store, false);
		if (store.config.outputFormat == 'canvas') {
			Canvas.drawGrid(store);
			Canvas.drawPacman(store);
			Canvas.drawGhosts(store);
			Canvas.drawSoundController(store);
		}
		return;
	}

	/* -------- pacman timers (GHOST EATEN PAUSE) -------- */
	if (store.pacman.pauseRemainingDuration > 0) {
		store.pacman.pauseRemainingDuration--;

		// Also update ghosts death pause
		store.ghosts.forEach((ghost) => {
			if (ghost.deathPauseDuration > 0) {
				ghost.deathPauseDuration--;
				if (ghost.deathPauseDuration === 0) {
					ghost.name = 'eyes';
				}
			}
		});

		if (headless) return;

		// Snapshot and render the current state, then pause logic
		pushSnapshot(store, false);
		if (store.config.outputFormat == 'canvas') {
			Canvas.drawGrid(store);
			Canvas.drawPacman(store);
			Canvas.drawGhosts(store);
			Canvas.drawSoundController(store);
		}
		return;
	}

	if (store.gameEnded) return;

	store.frameCount++;

	/* ---- FRAME-SKIP restored ---- */
	if (!headless && !forceFinish && store.frameCount % store.config.gameSpeed !== 0) {
		pushSnapshot(store, false);
		return;
	}

	/* -------- pacman timers -------- */
	if (store.pacman.powerupRemainingDuration > 0) {
		store.pacman.powerupRemainingDuration--;
		if (store.pacman.powerupRemainingDuration === 0) {
			store.ghosts.forEach((g) => {
				// ONLY revert ghosts that are actually scared.
				// If they are 'eyes', they MUST continue to the house.
				if (g.scared && g.name !== 'eyes') {
					g.scared = false;
				}
			});
			store.pacman.points = 0;
		}
	}

	/* -- ghost respawn -- */
	store.ghosts.forEach((ghost) => {
		if (ghost.inHouse && ghost.respawnCounter && ghost.respawnCounter > 0) {
			ghost.respawnCounter--;
			if (ghost.respawnCounter === 0) {
				ghost.name = ghost.originalName || determineGhostName(store.ghosts.indexOf(ghost));
				ghost.inHouse = false;
				ghost.scared = store.pacman.powerupRemainingDuration > 0;
				ghost.justReleasedFromHouse = true;
			}
		}
		if (ghost.freezeCounter) {
			ghost.freezeCounter--;
			if (ghost.freezeCounter === 0) {
				releaseGhostFromHouse(store, ghost.name);
			}
		}
	});

	/* -------- end of game -------- */
	const remaining = store.grid.some((row) => row.some((c) => c.commitsCount > 0));
	if (!remaining || forceFinish) {
		store.gameEnded = true;

		if (headless) return;

		if (store.config.outputFormat === 'svg') {
			const svg = SVG.generateAnimatedSVG(store);
			store.config.svgCallback(svg);
		}
		if (store.config.outputFormat == 'canvas') {
			Canvas.renderGameOver(store);
			MusicPlayer.getInstance()
				.play(Sound.BEGINNING)
				.then(() => MusicPlayer.getInstance().stopDefaultSound());
		}
		store.config.gameOverCallback();
		return;
	}

	/* -------- movements -------- */
	const pointEaten = PacmanMovement.movePacman(store);

	const cell = store.grid[store.pacman.x]?.[store.pacman.y];
	if (cell && cell.level === 'FOURTH_QUARTILE' && store.pacman.powerupRemainingDuration === 0) {
		store.pacman.powerupRemainingDuration = 30;
		store.ghosts.forEach((g) => {
			if (g.name !== 'eyes') {
				g.scared = true;
				// Classic Pac-Man: Ghosts reverse direction immediately when scared
				const opposite: Record<string, 'up' | 'down' | 'left' | 'right'> = {
					up: 'down',
					down: 'up',
					left: 'right',
					right: 'left'
				};
				g.direction = opposite[g.direction] || g.direction;
			}
		});
	}

	checkCollisions(store);

	if (store.pacman.deadRemainingDuration === 0) {
		GhostsMovement.moveGhosts(store);
		checkCollisions(store);
	}

	store.pacmanMouthOpen = !store.pacmanMouthOpen;

	if (headless) return;

	/* ---- single snapshot per frame ---- */
	// Snapshot grid INSTANTLY if a point was eaten, otherwise every 10 frames to save memory
	const shouldSnapshotGrid = pointEaten || store.frameCount % 10 === 0;
	pushSnapshot(store, shouldSnapshotGrid);

	if (store.config.outputFormat == 'canvas') Canvas.drawGrid(store);
	if (store.config.outputFormat == 'canvas') Canvas.drawPacman(store);
	if (store.config.outputFormat == 'canvas') Canvas.drawGhosts(store);
	if (store.config.outputFormat == 'canvas') Canvas.drawSoundController(store);
};

/* ---------- snapshot helper ---------- */
const pushSnapshot = (store: StoreType, includeGrid: boolean) => {
	let gridSnapshot = null;

	if (includeGrid || store.gameHistory.length === 0) {
		gridSnapshot = store.grid.map((row) =>
			row.map((col) => ({
				level: col.level,
				color: col.color
			}))
		);
	} else {
		// Reuse previous grid to save memory
		const lastHistory = store.gameHistory[store.gameHistory.length - 1];
		gridSnapshot = lastHistory ? lastHistory.grid : store.grid;
	}

	store.gameHistory.push({
		pacman: { ...store.pacman },
		ghosts: store.ghosts.map((g) => ({ ...g })),
		grid: gridSnapshot as any
	});
};

/* ---------- collisions & house ---------- */

const checkCollisions = (store: StoreType) => {
	if (store.pacman.deadRemainingDuration || store.pacman.pauseRemainingDuration) return;

	store.ghosts.forEach((ghost) => {
		// If the ghost is eyes or in death pause, there should be no collision
		if (ghost.name === 'eyes' || ghost.deathPauseDuration > 0) return;

		if (ghost.x === store.pacman.x && ghost.y === store.pacman.y) {
			if (store.pacman.powerupRemainingDuration && ghost.scared) {
				ghost.originalName = ghost.name;
				// ghost.name = 'eyes'; // Moved to game loop after deathPauseDuration
				ghost.scared = false;
				ghost.target = { x: 26, y: 3 };
				store.pacman.points += 10;
				store.pacman.pauseRemainingDuration = PACMAN_EAT_GHOST_PAUSE_DURATION;
				ghost.deathPauseDuration = PACMAN_EAT_GHOST_PAUSE_DURATION;
			} else {
				store.pacman.points = 0;
				store.pacman.powerupRemainingDuration = 0;
				if (store.pacman.deadRemainingDuration === 0) {
					store.pacman.deadRemainingDuration = PACMAN_DEATH_DURATION;
				}
			}
		}
	});
};

const releaseGhostFromHouse = (store: StoreType, name: GhostName) => {
	const ghost = store.ghosts.find((g) => g.name === name && g.inHouse);
	if (ghost) {
		ghost.justReleasedFromHouse = true;
		// The ghost will move towards x=27, y=3 in moveGhostInHouse
	}
};

export const Game = {
	startGame,
	stopGame
};
