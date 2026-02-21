import { GRID_HEIGHT, GRID_WIDTH, WALLS, hasWall, setWall } from '../core/constants';

describe('Walls and constants', () => {
	beforeEach(() => {
		// reset WALLS
		for (let x = 0; x < WALLS.horizontal.length; x++) {
			for (let y = 0; y < WALLS.horizontal[0].length; y++) {
				WALLS.horizontal[x][y] = { active: false };
			}
		}
		for (let x = 0; x < WALLS.vertical.length; x++) {
			for (let y = 0; y < WALLS.vertical[0].length; y++) {
				WALLS.vertical[x][y] = { active: false };
			}
		}
	});

	it('GRID sizes are positive and standard', () => {
		expect(GRID_WIDTH).toBeGreaterThan(0);
		expect(GRID_HEIGHT).toBe(7);
	});

	it('setWall toggles correct cells and hasWall reflects it', () => {
		setWall(0, 0, 'horizontal');
		expect(WALLS.horizontal[0][0].active).toBe(true);
		expect(hasWall(0, 0, 'up')).toBe(true);
		expect(hasWall(0, 0, 'down')).toBe(false);

		setWall(0, 1, 'horizontal');
		expect(hasWall(0, 0, 'down')).toBe(true);

		setWall(0, 0, 'vertical');
		expect(WALLS.vertical[0][0].active).toBe(true);
		expect(hasWall(0, 0, 'left')).toBe(true);
		expect(hasWall(0, 0, 'right')).toBe(false);

		setWall(1, 0, 'vertical');
		expect(hasWall(0, 0, 'right')).toBe(true);
	});
});
