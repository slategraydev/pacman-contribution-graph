import { setWall } from '../core/constants';

const buildWalls = () => {
	// (0,0,right) places a bar to the right of the first commit (cell 0,0)

	const YELLOW = '#FFFF00';
	const GRAY = '#808080';
	const RED = '#D51D1D';

	// SLATE
	// S
	setWall(3, 0, 'down', YELLOW);
	setWall(4, 0, 'down', YELLOW);
	setWall(2, 1, 'right', YELLOW);
	setWall(2, 2, 'right', YELLOW);
	setWall(3, 2, 'down', YELLOW);
	setWall(4, 2, 'down', YELLOW);
	setWall(4, 3, 'right', YELLOW);
	setWall(4, 4, 'right', YELLOW);
	setWall(4, 4, 'down', YELLOW);
	setWall(3, 4, 'down', YELLOW);

	// L
	setWall(6, 1, 'right', YELLOW);
	setWall(6, 2, 'right', YELLOW);
	setWall(6, 3, 'right', YELLOW);
	setWall(6, 4, 'right', YELLOW);
	setWall(7, 4, 'down', YELLOW);
	setWall(8, 4, 'down', YELLOW);

	// A
	setWall(11, 0, 'down', YELLOW);
	setWall(12, 0, 'down', YELLOW);
	setWall(10, 1, 'right', YELLOW);
	setWall(10, 2, 'right', YELLOW);
	setWall(10, 3, 'right', YELLOW);
	setWall(10, 4, 'right', YELLOW);
	setWall(12, 1, 'right', YELLOW);
	setWall(12, 2, 'right', YELLOW);
	setWall(12, 3, 'right', YELLOW);
	setWall(12, 4, 'right', YELLOW);
	setWall(11, 2, 'down', YELLOW);
	setWall(12, 2, 'down', YELLOW);

	// T
	setWall(15, 0, 'down', YELLOW);
	setWall(16, 0, 'down', YELLOW);
	setWall(15, 1, 'right', YELLOW);
	setWall(15, 2, 'right', YELLOW);
	setWall(15, 3, 'right', YELLOW);
	setWall(15, 4, 'right', YELLOW);

	// E
	setWall(18, 1, 'right', YELLOW);
	setWall(18, 2, 'right', YELLOW);
	setWall(18, 3, 'right', YELLOW);
	setWall(18, 4, 'right', YELLOW);
	setWall(19, 0, 'down', YELLOW);
	setWall(20, 0, 'down', YELLOW);
	setWall(19, 2, 'down', YELLOW);
	setWall(20, 2, 'down', YELLOW);
	setWall(19, 4, 'down', YELLOW);
	setWall(20, 4, 'down', YELLOW);

	// GRAY
	// G
	setWall(30, 0, 'down', YELLOW);
	setWall(31, 0, 'down', YELLOW);
	setWall(29, 1, 'right', YELLOW);
	setWall(29, 2, 'right', YELLOW);
	setWall(29, 3, 'right', YELLOW);
	setWall(29, 4, 'right', YELLOW);
	setWall(30, 4, 'down', YELLOW);
	setWall(31, 4, 'down', YELLOW);
	setWall(31, 2, 'down', YELLOW);
	setWall(31, 3, 'right', YELLOW);
	setWall(31, 4, 'right', YELLOW);

	// R
	setWall(33, 1, 'right', YELLOW);
	setWall(33, 2, 'right', YELLOW);
	setWall(33, 3, 'right', YELLOW);
	setWall(33, 4, 'right', YELLOW);
	setWall(35, 0, 'down', YELLOW);
	setWall(35, 1, 'right', YELLOW);
	setWall(34, 2, 'down', YELLOW);
	setWall(35, 2, 'down', YELLOW);
	setWall(34, 3, 'right', YELLOW);
	setWall(35, 4, 'right', YELLOW);

	// A
	setWall(38, 0, 'down', YELLOW);
	setWall(39, 0, 'down', YELLOW);
	setWall(37, 1, 'right', YELLOW);
	setWall(37, 2, 'right', YELLOW);
	setWall(37, 3, 'right', YELLOW);
	setWall(37, 4, 'right', YELLOW);
	setWall(39, 1, 'right', YELLOW);
	setWall(39, 2, 'right', YELLOW);
	setWall(39, 3, 'right', YELLOW);
	setWall(39, 4, 'right', YELLOW);
	setWall(38, 2, 'down', YELLOW);

	// Y
	setWall(41, 0, 'right', YELLOW);
	setWall(41, 1, 'right', YELLOW);
	setWall(43, 0, 'right', YELLOW);
	setWall(43, 1, 'right', YELLOW);
	setWall(42, 2, 'down', YELLOW);
	setWall(42, 3, 'right', YELLOW);
	setWall(42, 4, 'right', YELLOW);
	setWall(42, 4, 'down', YELLOW);
	setWall(43, 4, 'down', YELLOW);

	// Horizontal line and framing
	for (let x = 2; x <= 44; x++) {
		setWall(x, 5, 'down', GRAY);
	}

	// End vertical lines and dividers between letters
	const dividerXPositions = [2, 5, 9, 13, 17, 25, 32, 36, 40];
	dividerXPositions.forEach((x) => {
		for (let y = 0; y <= 5; y++) {
			setWall(x, y, 'right', GRAY);
		}
	});
	// Final right-most vertical line
	for (let y = 0; y <= 5; y++) {
		setWall(44, y, 'right', GRAY);
	}

	// Ghost House
	setWall(25, 3, 'up', RED);
	setWall(27, 3, 'up', RED);
	setWall(25, 4, 'down', RED);
	setWall(26, 4, 'down', RED);
	setWall(27, 4, 'down', RED);
	setWall(25, 3, 'left', RED);
	setWall(25, 4, 'left', RED);
	setWall(27, 3, 'right', RED);
	setWall(27, 4, 'right', RED);
};

export const Grid = {
	buildWalls
};
