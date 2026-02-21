import { setWall } from '../core/constants';

const buildWalls = () => {
	// (0,0,right) places a bar to the right of the first commit (cell 0,0)

	const GRAY = '#808080';
	const RED = '#D51D1D';

	// SLATE
	// S
	setWall(3, 0, 'down', RED);
	setWall(4, 0, 'down', RED);
	setWall(2, 1, 'right', RED);
	setWall(2, 2, 'right', RED);
	setWall(3, 2, 'down', RED);
	setWall(4, 2, 'down', RED);
	setWall(4, 3, 'right', RED);
	setWall(4, 4, 'right', RED);
	setWall(4, 4, 'down', RED);
	setWall(3, 4, 'down', RED);

	// L
	setWall(6, 1, 'right', RED);
	setWall(6, 2, 'right', RED);
	setWall(6, 3, 'right', RED);
	setWall(6, 4, 'right', RED);
	setWall(7, 4, 'down', RED);
	setWall(8, 4, 'down', RED);

	// A
	setWall(11, 0, 'down', RED);
	setWall(12, 0, 'down', RED);
	setWall(10, 1, 'right', RED);
	setWall(10, 2, 'right', RED);
	setWall(10, 3, 'right', RED);
	setWall(10, 4, 'right', RED);
	setWall(12, 1, 'right', RED);
	setWall(12, 2, 'right', RED);
	setWall(12, 3, 'right', RED);
	setWall(12, 4, 'right', RED);
	setWall(11, 2, 'down', RED);
	setWall(12, 2, 'down', RED);

	// T
	setWall(15, 0, 'down', RED);
	setWall(16, 0, 'down', RED);
	setWall(15, 1, 'right', RED);
	setWall(15, 2, 'right', RED);
	setWall(15, 3, 'right', RED);
	setWall(15, 4, 'right', RED);

	// E
	setWall(18, 1, 'right', RED);
	setWall(18, 2, 'right', RED);
	setWall(18, 3, 'right', RED);
	setWall(18, 4, 'right', RED);
	setWall(19, 0, 'down', RED);
	setWall(20, 0, 'down', RED);
	setWall(19, 2, 'down', RED);
	setWall(20, 2, 'down', RED);
	setWall(19, 4, 'down', RED);
	setWall(20, 4, 'down', RED);

	// GRAY
	// G
	setWall(32, 0, 'down', RED);
	setWall(33, 0, 'down', RED);
	setWall(31, 1, 'right', RED);
	setWall(31, 2, 'right', RED);
	setWall(31, 3, 'right', RED);
	setWall(31, 4, 'right', RED);
	setWall(32, 4, 'down', RED);
	setWall(33, 4, 'down', RED);
	setWall(33, 2, 'down', RED);
	setWall(33, 3, 'right', RED);
	setWall(33, 4, 'right', RED);

	// R
	setWall(35, 1, 'right', RED);
	setWall(35, 2, 'right', RED);
	setWall(35, 3, 'right', RED);
	setWall(35, 4, 'right', RED);
	setWall(37, 0, 'down', RED);
	setWall(37, 1, 'right', RED);
	setWall(36, 2, 'down', RED);
	setWall(37, 2, 'down', RED);
	setWall(36, 3, 'right', RED);
	setWall(37, 4, 'right', RED);

	// A
	setWall(40, 0, 'down', RED);
	setWall(41, 0, 'down', RED);
	setWall(39, 1, 'right', RED);
	setWall(39, 2, 'right', RED);
	setWall(39, 3, 'right', RED);
	setWall(39, 4, 'right', RED);
	setWall(41, 1, 'right', RED);
	setWall(41, 2, 'right', RED);
	setWall(41, 3, 'right', RED);
	setWall(41, 4, 'right', RED);
	setWall(40, 2, 'down', RED);
	setWall(41, 2, 'down', RED);

	// Y
	setWall(43, 0, 'right', RED);
	setWall(41, 1, 'right', RED);
	setWall(45, 0, 'right', RED);
	setWall(45, 1, 'right', RED);
	setWall(44, 2, 'down', RED);
	setWall(44, 3, 'right', RED);
	setWall(44, 4, 'right', RED);
	setWall(44, 4, 'down', RED);
	setWall(45, 4, 'down', RED);

	// Horizontal line and framing
	for (let x = 2; x <= 50; x++) {
		setWall(x, 5, 'down', GRAY);
	}

	// End vertical lines and dividers between letters
	const dividerXPositions = [1, 5, 9, 13, 17, 21, 30, 34, 38, 42, 50];
	dividerXPositions.forEach((x) => {
		for (let y = 1; y <= 5; y++) {
			setWall(x, y, 'right', GRAY);
		}
	});
	// Final right-most vertical line
	for (let y = 1; y <= 5; y++) {
		setWall(46, y, 'right', GRAY);
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
