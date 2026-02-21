import { DELTA_TIME, GRID_HEIGHT, GRID_WIDTH, PACMAN_POWERUP_DURATION } from '../core/constants';
import { PlayerStyle, Point2d, StoreType } from '../types';
import { Utils } from '../utils/utils';
import { MovementUtils } from './movement-utils';

const RECENT_POSITIONS_LIMIT = 5;

const movePacman = (store: StoreType): boolean => {
	if (store.pacman.deadRemainingDuration) return false;

	const hasPowerup = !!store.pacman.powerupRemainingDuration;
	const scaredGhosts = store.ghosts.filter((ghost) => ghost.scared);

	let targetPosition: Point2d & { value: number };

	// Find a target position, ensuring it's never undefined
	try {
		const ghostTarget = findClosestScaredGhost(store);
		const dotTarget = findOptimalTarget(store);

		// Check for immediate danger: Fleeing takes priority over everything if ghosts are too close
		let immediateDanger = false;
		let safestEscape: Point2d | null = null;

		const dangerThreshold = 4;
		const dangerousGhosts = store.ghosts.filter(
			(g) =>
				!g.scared &&
				g.name !== 'eyes' &&
				MovementUtils.calculateDistance(g.x, g.y, store.pacman.x, store.pacman.y) < dangerThreshold
		);

		if (dangerousGhosts.length > 0) {
			immediateDanger = true;
			// Target a point far away from the dangerous ghosts
			const avgX = dangerousGhosts.reduce((sum, g) => sum + g.x, 0) / dangerousGhosts.length;
			const avgY = dangerousGhosts.reduce((sum, g) => sum + g.y, 0) / dangerousGhosts.length;

			// Simple flee: target the corner furthest from the ghost group
			safestEscape = {
				x: avgX > GRID_WIDTH / 2 ? 0 : GRID_WIDTH - 1,
				y: avgY > GRID_HEIGHT / 2 ? 0 : GRID_HEIGHT - 1,
				value: 5000 // High priority to ensure lock
			};
		}

		const currentTarget = store.pacman.target;

		let bestAvailable: Point2d & { value: number } = dotTarget;
		if (immediateDanger && safestEscape) {
			bestAvailable = safestEscape as Point2d & { value: number };
		} else if (ghostTarget && (!dotTarget || ghostTarget.value > dotTarget.value)) {
			bestAvailable = ghostTarget as Point2d & { value: number };
		}

		if (
			!currentTarget ||
			(store.pacman.x === currentTarget.x && store.pacman.y === currentTarget.y) ||
			(bestAvailable && bestAvailable.value > (currentTarget.value || 0) * 1.5) ||
			(immediateDanger && (!currentTarget.value || currentTarget.value < 1000)) // Force break lock if in danger
		) {
			targetPosition = bestAvailable;
			store.pacman.target = targetPosition;
		} else {
			targetPosition = { ...currentTarget, value: currentTarget.value || 0 } as Point2d & { value: number };
		}

		// Safety check to ensure targetPosition is never undefined
		if (!targetPosition) {
			targetPosition = { x: store.pacman.x, y: store.pacman.y, value: 0 };
		}
		const nextPosition = calculateOptimalPath(store, targetPosition);
		nextPosition ? updatePacmanPosition(store, nextPosition) : makeDesperationMove(store);

		return checkAndEatPoint(store);
	} catch (error) {
		console.error('Error in movePacman:', error);
		return false;
	}
};

const findClosestScaredGhost = (store: StoreType): (Point2d & { value: number }) | null => {
	const scaredGhosts = store.ghosts.filter((g) => g.scared);
	if (scaredGhosts.length === 0) return null;

	const closest = scaredGhosts.reduce(
		(closest, ghost) => {
			const distance = MovementUtils.calculateDistance(ghost.x, ghost.y, store.pacman.x, store.pacman.y);
			return distance < closest.distance ? { x: ghost.x, y: ghost.y, distance } : closest;
		},
		{ x: store.pacman.x, y: store.pacman.y, distance: Infinity }
	);

	if (closest.distance === Infinity) return null;

	return {
		x: closest.x,
		y: closest.y,
		// Give scared ghosts a much higher base value to ensure they are prioritized over dots
		value: (1000 / (closest.distance + 1)) * 3
	};
};

const findOptimalTarget = (store: StoreType): Point2d & { value: number } => {
	const pointCells: { x: number; y: number; value: number }[] = [];

	for (let x = 0; x < GRID_WIDTH; x++) {
		for (let y = 0; y < GRID_HEIGHT; y++) {
			const cell = store.grid[x][y];
			if (cell.level !== 'NONE') {
				const distance = MovementUtils.calculateDistance(x, y, store.pacman.x, store.pacman.y);

				// Priority: Power-up (FOURTH_QUARTILE) > Regular commits
				const levelMultiplier = cell.level === 'FOURTH_QUARTILE' ? 10 : 1;
				const value = (cell.commitsCount * levelMultiplier) / (distance + 1);

				pointCells.push({ x, y, value });
			}
		}
	}

	pointCells.sort((a, b) => b.value - a.value);

	// Check if there are any cells with points left
	if (pointCells.length === 0) {
		// Return Pac-Man's current position as fallback
		return { x: store.pacman.x, y: store.pacman.y, value: 0 };
	}

	return pointCells[0];
};

const calculateOptimalPath = (store: StoreType, target: Point2d) => {
	const queue: { x: number; y: number; path: Point2d[]; score: number }[] = [
		{ x: store.pacman.x, y: store.pacman.y, path: [], score: 0 }
	];
	const visited = new Set<string>([`${store.pacman.x},${store.pacman.y}`]);
	const dangerMap = createDangerMap(store);

	const maxDangerValue = 25; // Increased to match new danger radius

	// Set weights according to player style - more extreme values
	let safetyWeight = 1.0;
	let pointWeight = 0.5;

	switch (store.config.playerStyle) {
		case PlayerStyle.CONSERVATIVE:
			safetyWeight = 5.0;
			pointWeight = 0.1;
			break;
		case PlayerStyle.AGGRESSIVE:
			safetyWeight = 0.5;
			pointWeight = 2.0;
			break;
		case PlayerStyle.OPPORTUNISTIC:
		default:
			safetyWeight = 1.5; // Slightly higher to ensure he flees effectively
			pointWeight = 0.8;
			break;
	}

	while (queue.length > 0) {
		queue.sort((a, b) => b.score - a.score);
		const current = queue.shift()!;
		const { x, y, path } = current;

		if (x === target.x && y === target.y) {
			if (path.length > 0) return path[0];
			return null;
		}

		for (const [dx, dy] of MovementUtils.getValidMoves(x, y)) {
			const newX = x + dx;
			const newY = y + dy;
			const key = `${newX},${newY}`;

			if (!visited.has(key)) {
				const newPath = [...path, { x: newX, y: newY }];
				const danger = dangerMap.get(key) || 0;
				const pointValue = store.grid[newX][newY].commitsCount;
				const isPowerup = store.grid[newX][newY].level === 'FOURTH_QUARTILE';

				// A* Heuristic
				const h = Math.abs(newX - target.x) + Math.abs(newY - target.y);
				const distanceToTarget = h;

				const revisitPenalty = store.pacman.recentPositions?.includes(key) ? 100 : 0;

				// Danger is a subtraction from score. High danger = low priority
				const safetyScore = (maxDangerValue - danger) * safetyWeight;
				const pointScore = (isPowerup ? pointValue * 10 : pointValue) * pointWeight;
				const distanceScore = -distanceToTarget / 5;

				const finalScore = safetyScore + pointScore + distanceScore - revisitPenalty;

				queue.push({
					x: newX,
					y: newY,
					path: newPath,
					score: finalScore
				});

				visited.add(key);
			}
		}
	}

	return null;
};

const createDangerMap = (store: StoreType) => {
	const map = new Map<string, number>();
	const hasPowerup = !!store.pacman.powerupRemainingDuration;

	store.ghosts.forEach((ghost) => {
		if (ghost.scared || ghost.name === 'eyes') return;

		// Increased radius (7) to make him flee sooner
		const radius = 7;
		for (let dx = -radius; dx <= radius; dx++) {
			for (let dy = -radius; dy <= radius; dy++) {
				const x = ghost.x + dx;
				const y = ghost.y + dy;

				if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
					const key = `${x},${y}`;
					const distance = Math.abs(dx) + Math.abs(dy);
					// Higher danger value (25 max) for close proximity
					const value = 25 - distance;

					if (value > 0) {
						const current = map.get(key) || 0;
						map.set(key, Math.max(current, value));
					}
				}
			}
		}
	});

	// If powered up, ghosts aren't dangerous, but we still prefer safe paths
	if (hasPowerup) {
		for (const [key, value] of map.entries()) {
			map.set(key, value / 10);
		}
	}

	return map;
};
const makeDesperationMove = (store: StoreType) => {
	const validMoves = MovementUtils.getValidMoves(store.pacman.x, store.pacman.y);
	if (validMoves.length === 0) return;

	const safest = validMoves.reduce(
		(best, [dx, dy]) => {
			const newX = store.pacman.x + dx;
			const newY = store.pacman.y + dy;
			let minDist = Infinity;

			store.ghosts.forEach((ghost) => {
				if (!ghost.scared) {
					const dist = MovementUtils.calculateDistance(ghost.x, ghost.y, newX, newY);
					minDist = Math.min(minDist, dist);
				}
			});

			return minDist > best.distance ? { dx, dy, distance: minDist } : best;
		},
		{ dx: 0, dy: 0, distance: -Infinity }
	);

	updatePacmanPosition(store, {
		x: store.pacman.x + safest.dx,
		y: store.pacman.y + safest.dy
	});
};

const updatePacmanPosition = (store: StoreType, position: Point2d) => {
	store.pacman.recentPositions ||= [];
	store.pacman.recentPositions.push(`${position.x},${position.y}`);
	if (store.pacman.recentPositions.length > RECENT_POSITIONS_LIMIT) {
		store.pacman.recentPositions.shift();
	}

	const dx = position.x - store.pacman.x;
	const dy = position.y - store.pacman.y;

	store.pacman.direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : store.pacman.direction;

	store.pacman.x = position.x;
	store.pacman.y = position.y;
};

const checkAndEatPoint = (store: StoreType): boolean => {
	const cell = store.grid[store.pacman.x][store.pacman.y];
	if (cell.level !== 'NONE') {
		store.pacman.totalPoints += cell.commitsCount;
		store.pacman.points++;
		store.config.pointsIncreasedCallback(store.pacman.totalPoints);

		const theme = Utils.getCurrentTheme(store);
		// Power-up activated in the cell
		if (cell.level === 'FOURTH_QUARTILE') {
			activatePowerUp(store);
		}

		// "Delete" point from cell
		cell.level = 'NONE';
		cell.color = theme.intensityColors[0];
		cell.commitsCount = 0;

		return true;
	}
	return false;
};

const activatePowerUp = (store: StoreType) => {
	store.pacman.powerupRemainingDuration = PACMAN_POWERUP_DURATION;
	store.ghosts.forEach((g) => (g.scared = true));
};

export const PacmanMovement = {
	movePacman
};
