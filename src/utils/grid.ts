import { setWall } from '../core/constants';

const buildWalls = () => {
	// Example of direct placement
	setWall(4, 1, 'horizontal');
	setWall(5, 1, 'horizontal');
	setWall(3, 1, 'vertical');
	setWall(3, 2, 'vertical');
	setWall(4, 3, 'horizontal');
	setWall(4, 4, 'horizontal');
	setWall(5, 4, 'vertical');
	setWall(5, 5, 'vertical');
	setWall(4, 5, 'horizontal');
	setWall(5, 5, 'horizontal');

	// Ghost House
	setWall(25, 2, 'horizontal');
	setWall(27, 2, 'horizontal');
	setWall(25, 4, 'horizontal');
	setWall(26, 4, 'horizontal');
	setWall(27, 4, 'horizontal');
	setWall(25, 3, 'vertical');
	setWall(28, 3, 'vertical');
	setWall(25, 2, 'vertical');
	setWall(28, 2, 'vertical');
};

export const Grid = {
	buildWalls
};
