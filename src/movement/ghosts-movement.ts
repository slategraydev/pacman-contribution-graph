import { GRID_HEIGHT, GRID_WIDTH } from '../core/constants';
import { Ghost, Point2d, StoreType } from '../types';
import { MovementUtils } from './movement-utils';

// Constants for ghost behavior
const SCATTER_MODE_DURATION = 7;
const CHASE_MODE_DURATION = 20;
const SCATTER_CORNERS: Record<string, Point2d> = {
	blinky: { x: GRID_WIDTH - 1, y: 0 },
	pinky: { x: 0, y: 0 },
	inky: { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 },
	clyde: { x: 0, y: GRID_HEIGHT - 1 }
};

// Global status of game modes
let currentMode = 'scatter';
let modeTimer = 0;
let dotsRemaining = 0;

const moveGhosts = (store: StoreType) => {
	dotsRemaining = countRemainingDots(store);
	updateGameMode(store);

	for (const ghost of store.ghosts) {
		if (ghost.inHouse) {
			moveGhostInHouse(ghost, store);
			if (ghost.inHouse) continue;
		}

		let target: Point2d;

		if (ghost.name === 'eyes') {
			moveEyesToHome(ghost, store);
			continue;
		} else if (ghost.scared) {
			// When scared, target the scatter corner (arcade-like "fleeing")
			target = SCATTER_CORNERS[ghost.name] || SCATTER_CORNERS['blinky'];
		} else if (currentMode === 'scatter') {
			target = SCATTER_CORNERS[ghost.name] || SCATTER_CORNERS['blinky'];
		} else {
			target = calculateGhostTarget(ghost, store);
		}

		ghost.target = target;

		// Use Arcade-style Target-Tile logic: Pick the move that results in the shortest
		// straight-line distance to the target, and NEVER reverse direction.
		const nextMove = getTargetTileMove(ghost, target, store);

		if (nextMove) {
			ghost.x = nextMove.x;
			ghost.y = nextMove.y;
			ghost.direction = nextMove.direction;
		}
	}
};

const getTargetTileMove = (ghost: Ghost, target: Point2d, store: StoreType) => {
	const validMoves = MovementUtils.getValidMoves(ghost.x, ghost.y, true);

	const filteredMoves = validMoves.filter(([dx, dy]) => {
		if (ghost.direction === 'up' && dy > 0) return false;
		if (ghost.direction === 'down' && dy < 0) return false;
		if (ghost.direction === 'left' && dx > 0) return false;
		if (ghost.direction === 'right' && dx < 0) return false;
		return true;
	});

	const movesToEvaluate = filteredMoves.length > 0 ? filteredMoves : validMoves;

	let bestMove = null;

	if (ghost.scared) {
		// VERY SCARED: Calculate distance to Pac-Man for each move and pick the one that
		// results in the MAXIMUM distance from him.
		let maxDistFromPacman = -Infinity;
		for (const [dx, dy] of movesToEvaluate) {
			const nx = ghost.x + dx;
			const ny = ghost.y + dy;
			const dist = Math.sqrt(Math.pow(store.pacman.x - nx, 2) + Math.pow(store.pacman.y - ny, 2));
			if (dist > maxDistFromPacman) {
				maxDistFromPacman = dist;
				bestMove = { x: nx, y: ny, direction: getDirectionFromDelta(dx, dy) };
			}
		}
		return bestMove;
	}

	// ULTRA AGGRESSIVE: For Blinky and Pinky, look 2 steps ahead to pick the best path
	const isStalker = ghost.name === 'blinky' || ghost.name === 'pinky';
	let minDistance = Infinity;

	for (const [dx, dy] of movesToEvaluate) {
		const nx = ghost.x + dx;
		const ny = ghost.y + dy;

		// If aggressive, consider the distance after another potential move
		let weight = Math.sqrt(Math.pow(target.x - nx, 2) + Math.pow(target.y - ny, 2));

		if (isStalker) {
			// Lookahead bonus: check if this move opens up even better paths
			const nextValid = MovementUtils.getValidMoves(nx, ny, true);
			let nextMin = Infinity;
			for (const [ndx, ndy] of nextValid) {
				const nnx = nx + ndx;
				const nny = ny + ndy;
				nextMin = Math.min(nextMin, Math.sqrt(Math.pow(target.x - nnx, 2) + Math.pow(target.y - nny, 2)));
			}
			weight = (weight + nextMin) / 2;
		}

		if (weight < minDistance) {
			minDistance = weight;
			bestMove = {
				x: nx,
				y: ny,
				direction: getDirectionFromDelta(dx, dy)
			};
		}
	}

	return bestMove;
};

const getDirectionFromDelta = (dx: number, dy: number): 'up' | 'down' | 'left' | 'right' => {
	if (dx > 0) return 'right';
	if (dx < 0) return 'left';
	if (dy > 0) return 'down';
	return 'up';
};

const countRemainingDots = (store: StoreType): number => {
	let count = 0;
	for (let x = 0; x < GRID_WIDTH; x++) {
		for (let y = 0; y < GRID_HEIGHT; y++) {
			if (store.grid[x][y].level !== 'NONE') count++;
		}
	}
	return count;
};

const updateGameMode = (store: StoreType) => {
	if (store.pacman.powerupRemainingDuration > 0) return;

	modeTimer++;
	const modeDuration = currentMode === 'scatter' ? SCATTER_MODE_DURATION : CHASE_MODE_DURATION;

	if (modeTimer >= modeDuration * (1000 / 200)) {
		currentMode = currentMode === 'scatter' ? 'chase' : 'scatter';
		modeTimer = 0;
		// Reverse direction on mode swap
		store.ghosts.forEach((ghost) => {
			if (!ghost.inHouse && ghost.name !== 'eyes') {
				const opposite: Record<string, any> = { up: 'down', down: 'up', left: 'right', right: 'left' };
				ghost.direction = opposite[ghost.direction] || ghost.direction;
			}
		});
	}
};

const moveGhostInHouse = (ghost: Ghost, store: StoreType) => {
	// If the ghost is in the middle of being released, it moves towards the door (x=26, y=2)
	if (ghost.justReleasedFromHouse) {
		if (ghost.x === 26) {
			if (ghost.y > 2) {
				ghost.y -= 1;
				ghost.direction = 'up';
			} else {
				ghost.inHouse = false;
				ghost.justReleasedFromHouse = false;
			}
		} else {
			// Move horizontally towards the center column (26)
			ghost.x < 26 ? ((ghost.x += 1), (ghost.direction = 'right')) : ((ghost.x -= 1), (ghost.direction = 'left'));
		}
		return;
	}

	if (ghost.respawnCounter && ghost.respawnCounter > 0) {
		ghost.respawnCounter--;
		if (ghost.respawnCounter === 0 && ghost.originalName) {
			ghost.name = ghost.originalName;
			ghost.inHouse = true; // Stay in house to bob until released by timer
			ghost.respawning = false;
		} else {
			return;
		}
	}

	// Arcade Feature: 1-grid vertical bobbing (between y=3 and y=4)
	const topLimit = 3;
	const bottomLimit = 4;

	if (ghost.direction === 'up') {
		if (ghost.y <= topLimit) {
			ghost.direction = 'down';
			ghost.y = bottomLimit;
		} else {
			ghost.y = topLimit;
		}
	} else {
		if (ghost.y >= bottomLimit) {
			ghost.direction = 'up';
			ghost.y = topLimit;
		} else {
			ghost.y = bottomLimit;
		}
	}
};

const moveEyesToHome = (ghost: Ghost, store: StoreType) => {
	const home = { x: 26, y: 3 };
	if (Math.abs(ghost.x - home.x) <= 1 && Math.abs(ghost.y - home.y) <= 1) {
		ghost.x = home.x;
		ghost.y = home.y;
		ghost.inHouse = true;
		ghost.respawnCounter = 1;
		return;
	}
	const next = MovementUtils.findNextStepDijkstra({ x: ghost.x, y: ghost.y }, home);
	if (next) {
		ghost.direction = getDirectionFromDelta(next.x - ghost.x, next.y - ghost.y);
		ghost.x = next.x;
		ghost.y = next.y;
	}
};

const calculateGhostTarget = (ghost: Ghost, store: StoreType): Point2d => {
	const { pacman } = store;
	const pacDir = getPacmanDirection(store);

	switch (ghost.name) {
		case 'blinky':
			return { x: pacman.x, y: pacman.y };
		case 'pinky':
			return { x: pacman.x + pacDir[0] * 4, y: pacman.y + pacDir[1] * 4 };
		case 'inky':
			const blinky = store.ghosts.find((g) => g.name === 'blinky') || { x: 0, y: 0 };
			const pivot = { x: pacman.x + pacDir[0] * 2, y: pacman.y + pacDir[1] * 2 };
			return { x: pivot.x + (pivot.x - blinky.x), y: pivot.y + (pivot.y - blinky.y) };
		case 'clyde':
			const dist = Math.sqrt(Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2));
			return dist > 8 ? { x: pacman.x, y: pacman.y } : SCATTER_CORNERS.clyde;
		default:
			return { x: pacman.x, y: pacman.y };
	}
};

const getPacmanDirection = (store: StoreType): [number, number] => {
	const ds: Record<string, [number, number]> = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
	return ds[store.pacman.direction] || [0, 0];
};

const resetMovement = () => {
	currentMode = 'scatter';
	modeTimer = 0;
};

export const GhostsMovement = {
	moveGhosts,
	resetMovement
};
