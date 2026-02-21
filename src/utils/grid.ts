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
