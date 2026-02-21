import { setWall } from '../core/constants';

const buildWalls = () => {
	// (0,0,right) places a bar to the right of the first commit (cell 0,0)

	// SLATE - Final Build Verification
	// S
	setWall(3, 0, 'down');
	setWall(4, 0, 'down');
	setWall(2, 1, 'right');
	setWall(2, 2, 'right');
	setWall(3, 2, 'down');
	setWall(4, 2, 'down');
	setWall(4, 3, 'right');
	setWall(4, 4, 'right');
	setWall(4, 4, 'down');
	setWall(3, 4, 'down');

	// L
	setWall(6, 1, 'right');
	setWall(6, 2, 'right');
	setWall(6, 3, 'right');
	setWall(6, 4, 'right');
	setWall(7, 4, 'down');
	setWall(8, 4, 'down');

	// A
	setWall(11, 0, 'down');
	setWall(12, 0, 'down');
	setWall(10, 1, 'right');
	setWall(10, 2, 'right');
	setWall(10, 3, 'right');
	setWall(10, 4, 'right');
	setWall(12, 1, 'right');
	setWall(12, 2, 'right');
	setWall(12, 3, 'right');
	setWall(12, 4, 'right');
	setWall(11, 2, 'down');
	setWall(12, 2, 'down');

	// T
	setWall(15, 0, 'down');
	setWall(16, 0, 'down');
	setWall(15, 1, 'right');
	setWall(15, 2, 'right');
	setWall(15, 3, 'right');
	setWall(15, 4, 'right');

	// E
	setWall(18, 1, 'right');
	setWall(18, 2, 'right');
	setWall(18, 3, 'right');
	setWall(18, 4, 'right');
	setWall(19, 0, 'down');
	setWall(20, 0, 'down');
	setWall(19, 2, 'down');
	setWall(20, 2, 'down');
	setWall(19, 4, 'down');
	setWall(20, 4, 'down');

	// Ghost House
	setWall(25, 3, 'up', '#D51D1D');
	setWall(27, 3, 'up', '#D51D1D');
	setWall(25, 4, 'down', '#D51D1D');
	setWall(26, 4, 'down', '#D51D1D');
	setWall(27, 4, 'down', '#D51D1D');
	setWall(25, 3, 'left', '#D51D1D');
	setWall(25, 4, 'left', '#D51D1D');
	setWall(27, 3, 'right', '#D51D1D');
	setWall(27, 4, 'right', '#D51D1D');
};

export const Grid = {
	buildWalls
};
