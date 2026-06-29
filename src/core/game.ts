import { GhostsMovement } from '../movement/ghosts-movement';
import { PacmanMovement } from '../movement/pacman-movement';
import { MusicPlayer, Sound } from '../music-player';
import { Canvas } from '../renderers/canvas';
import { SVG } from '../renderers/svg';
import { GhostName, StoreType } from '../types';
import { Utils } from '../utils/utils';
import { DELTA_TIME, PACMAN_DEATH_DURATION, PACMAN_EAT_GHOST_PAUSE_DURATION, PACMAN_POWERUP_DURATION } from './constants';
import { calculateTournamentScore, cloneGrid, ensureIntelligence, evolveIntelligence, hasRemainingCells } from './evolution';

/* ---------- positioning helpers ---------- */

const placePacman = (store: StoreType) => {
	store.pacman = {
		x: 26,
		y: 5,
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
	ensureIntelligence(store);

	const remainingCells = () => hasRemainingCells(store.grid);

	// --- THE DAILY TOURNAMENT (Evolutionary Step) ---
	if (store.config.runEvolution && store.config.outputFormat === 'svg') {
		if (remainingCells()) {
			const result = await evolveIntelligence(store, async (dna, grid) => {
				// Deep clone store for sandbox run, but preserve functions in config
				const sandboxStore: StoreType = JSON.parse(JSON.stringify(store));
				sandboxStore.config = {
					...store.config,
					intelligence: {
						...store.config.intelligence!,
						dna
					}
				};
				sandboxStore.grid = cloneGrid(grid);
				sandboxStore.frameCount = 0;
				sandboxStore.gameEnded = false;
				sandboxStore.gameHistory = [];

				placePacman(sandboxStore);
				placeGhosts(sandboxStore);

				const MAX_FRAMES = 5000;
				while (!sandboxStore.gameEnded && sandboxStore.frameCount < MAX_FRAMES) {
					await updateGame(sandboxStore, false, true); // true = headless
				}

				return calculateTournamentScore(sandboxStore);
			});

			const winnerDNA = store.config.intelligence!.dna;
			console.log(`🏆 Tournament winner: ${result.winnerName} (Score: ${result.bestScore.toFixed(2)})`);
			console.log(
				`🧬 New DNA: SAFE=${winnerDNA.safetyWeight.toFixed(2)}, GREED=${winnerDNA.pointWeight.toFixed(2)}, RAD=${winnerDNA.dangerRadius.toFixed(2)}, HUNT=${winnerDNA.scaredGhostWeight.toFixed(2)}`
			);
		}
	}

	// --- FINAL RENDERING RUN (Fallback/Canvas) ---
	if (store.config.outputFormat == 'canvas') {
		store.config.canvas = store.config.canvas;
		Canvas.resizeCanvas(store);
		Canvas.listenToSoundController(store);
	}

	store.frameCount = 0;
	store.gameHistory = []; // keeps clean
	store.ghosts.forEach((g) => (g.scared = false));

	// Grid is already initialized by start() in index.ts
	// store.grid = Utils.createGridFromData(store);

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
	/* -------- ghost timers (DEATH PAUSE) -------- */
	// This MUST run every frame, even if Pac-Man is paused, to ensure eyes transition
	store.ghosts.forEach((ghost) => {
		if (ghost.deathPauseDuration > 0) {
			ghost.deathPauseDuration--;
			if (ghost.deathPauseDuration === 0) {
				ghost.name = 'eyes';
			}
		}
	});

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
				// If they are 'eyes', they MUST continue to the house and will revert there.
				if (g.name !== 'eyes') {
					g.scared = false;
				}
			});
			store.pacman.points = 0;
		}
	}

	/* -- ghost respawn -- */
	store.ghosts.forEach((ghost) => {
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
		store.pacman.powerupRemainingDuration = PACMAN_POWERUP_DURATION;
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

	if (store.pacman.deadRemainingDuration === 0 && store.pacman.pauseRemainingDuration === 0) {
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

				// Set target home based on ghost name (Blinky returns to Inky's spot)
				if (ghost.name === 'pinky') ghost.target = { x: 25, y: 4 };
				else if (ghost.name === 'clyde') ghost.target = { x: 27, y: 4 };
				else ghost.target = { x: 26, y: 4 }; // Blinky and Inky

				store.pacman.points += 10;
				store.pacman.ghostsEaten = (store.pacman.ghostsEaten || 0) + 1;
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
