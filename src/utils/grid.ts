import { setWall } from '../core/constants';

const buildWalls = () => {
	// (1,1,right) places a bar to the right of the first commit (cell 0,0)

	// Ghost House (around center)
	setWall(26, 3, 'up'); // top
	setWall(28, 3, 'up'); // top
	setWall(26, 4, 'down'); // bottom
	setWall(27, 4, 'down');
	setWall(28, 4, 'down');
	setWall(26, 3, 'left'); // left
	setWall(26, 4, 'left'); // left
	setWall(28, 3, 'right'); // right side
	setWall(28, 4, 'right'); // right side
};

export const Grid = {
	buildWalls
};
