import { setWall } from '../core/constants';

const buildWalls = () => {
	// (0,0,right) places a bar to the right of the first commit (cell 0,0)

	const YELLOW = '#FFFF00';
	const WHITE = '#FFFFFF';
	const RED = '#D51D1D';

	// SLATE
	// S
	setWall(3, 0, 'down', WHITE);
	setWall(4, 0, 'down', WHITE);
	setWall(2, 1, 'right', WHITE);
	setWall(2, 2, 'right', WHITE);
	setWall(3, 2, 'down', WHITE);
	setWall(4, 2, 'down', WHITE);
	setWall(4, 3, 'right', WHITE);
	setWall(4, 4, 'right', WHITE);
	setWall(4, 4, 'down', WHITE);
	setWall(3, 4, 'down', WHITE);

	// L
	setWall(6, 1, 'right', WHITE);
	setWall(6, 2, 'right', WHITE);
	setWall(6, 3, 'right', WHITE);
	setWall(6, 4, 'right', WHITE);
	setWall(7, 4, 'down', WHITE);
	setWall(8, 4, 'down', WHITE);

	// A
	setWall(11, 0, 'down', WHITE);
	setWall(12, 0, 'down', WHITE);
	setWall(10, 1, 'right', WHITE);
	setWall(10, 2, 'right', WHITE);
	setWall(10, 3, 'right', WHITE);
	setWall(10, 4, 'right', WHITE);
	setWall(12, 1, 'right', WHITE);
	setWall(12, 2, 'right', WHITE);
	setWall(12, 3, 'right', WHITE);
	setWall(12, 4, 'right', WHITE);
	setWall(11, 2, 'down', WHITE);
	setWall(12, 2, 'down', WHITE);

	// T
	setWall(15, 0, 'down', WHITE);
	setWall(16, 0, 'down', WHITE);
	setWall(15, 1, 'right', WHITE);
	setWall(15, 2, 'right', WHITE);
	setWall(15, 3, 'right', WHITE);
	setWall(15, 4, 'right', WHITE);

	// E
	setWall(18, 1, 'right', WHITE);
	setWall(18, 2, 'right', WHITE);
	setWall(18, 3, 'right', WHITE);
	setWall(18, 4, 'right', WHITE);
	setWall(19, 0, 'down', WHITE);
	setWall(20, 0, 'down', WHITE);
	setWall(19, 2, 'down', WHITE);
	setWall(20, 2, 'down', WHITE);
	setWall(19, 4, 'down', WHITE);
	setWall(20, 4, 'down', WHITE);

	// GRAY
	// G
	setWall(32, 0, 'down', WHITE);
	setWall(33, 0, 'down', WHITE);
	setWall(31, 1, 'right', WHITE);
	setWall(31, 2, 'right', WHITE);
	setWall(31, 3, 'right', WHITE);
	setWall(31, 4, 'right', WHITE);
	setWall(32, 4, 'down', WHITE);
	setWall(33, 4, 'down', WHITE);
	setWall(33, 2, 'down', WHITE);
	setWall(33, 3, 'right', WHITE);
	setWall(33, 4, 'right', WHITE);

	// R
	setWall(35, 1, 'right', WHITE);
	setWall(35, 2, 'right', WHITE);
	setWall(35, 3, 'right', WHITE);
	setWall(35, 4, 'right', WHITE);
	setWall(36, 0, 'down', WHITE);
	setWall(37, 0, 'down', WHITE);
	setWall(37, 1, 'right', WHITE);
	setWall(37, 2, 'down', WHITE);
	setWall(36, 4, 'right', WHITE);
	setWall(37, 4, 'right', WHITE);

	// A
	setWall(40, 0, 'down', WHITE);
	setWall(41, 0, 'down', WHITE);
	setWall(39, 1, 'right', WHITE);
	setWall(39, 2, 'right', WHITE);
	setWall(39, 3, 'right', WHITE);
	setWall(39, 4, 'right', WHITE);
	setWall(41, 1, 'right', WHITE);
	setWall(41, 2, 'right', WHITE);
	setWall(41, 3, 'right', WHITE);
	setWall(41, 4, 'right', WHITE);
	setWall(40, 2, 'down', WHITE);
	setWall(41, 2, 'down', WHITE);

	// Y
	setWall(43, 1, 'right', WHITE);
	setWall(43, 2, 'right', WHITE);
	setWall(45, 1, 'right', WHITE);
	setWall(45, 2, 'right', WHITE);
	setWall(44, 2, 'down', WHITE);
	setWall(45, 2, 'down', WHITE);
	setWall(44, 3, 'right', WHITE);
	setWall(44, 4, 'right', WHITE);
	setWall(44, 4, 'down', WHITE);
	setWall(45, 4, 'down', WHITE);

	// SMILEY FACE
	setWall(47, 1, 'right', YELLOW);
	setWall(47, 2, 'right', YELLOW);
	setWall(49, 1, 'right', YELLOW);
	setWall(49, 2, 'right', YELLOW);
	setWall(47, 4, 'right', YELLOW);
	setWall(49, 4, 'right', YELLOW);
	setWall(48, 4, 'down', YELLOW);
	setWall(49, 4, 'down', YELLOW);

	// Horizontal line and framing
	for (let x = 2; x <= 50; x++) {
		setWall(x, 5, 'down', RED);
	}

	// End vertical lines and dividers between letters
	const dividerXPositions = [1, 5, 9, 13, 17, 21, 30, 34, 38, 42, 50];
	dividerXPositions.forEach((x) => {
		for (let y = 1; y <= 5; y++) {
			setWall(x, y, 'right', RED);
		}
	});
	// Final right-most vertical line
	for (let y = 1; y <= 5; y++) {
		setWall(46, y, 'right', RED);
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
