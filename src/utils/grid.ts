import { setWall } from '../core/constants';

const buildWalls = () => {
	// (1,1,right) places a bar to the right of the first commit

	// SLATE
	// S
	setWall(4, 1, 'down');
	setWall(5, 1, 'down');
	setWall(3, 2, 'right');
	setWall(3, 3, 'right');
	setWall(4, 3, 'down');
	setWall(5, 3, 'down');
	setWall(6, 3, 'down');
	setWall(5, 4, 'right');
	setWall(5, 5, 'right');
	setWall(5, 5, 'down');
	setWall(6, 5, 'down');

	// Ghost House
	setWall(26, 4, 'up');
	setWall(28, 4, 'up');
	setWall(26, 5, 'down');
	setWall(27, 5, 'down');
	setWall(28, 5, 'down');
	setWall(26, 4, 'left');
	setWall(26, 5, 'left');
	setWall(28, 4, 'right');
	setWall(28, 5, 'right');
};

export const Grid = {
	buildWalls
};
