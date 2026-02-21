import { GRID_HEIGHT, GRID_WIDTH, setWall } from '../core/constants';

const setSymmetricWall = (x: number, y: number, direction: 'horizontal' | 'vertical', sym: '' | 'x' | 'y' | 'xy', lineId: string) => {
	if (direction == 'horizontal') {
		setWall(x, y, 'horizontal', lineId);
		if (sym == 'x') {
			setWall(GRID_WIDTH - x - 1, y, 'horizontal', lineId);
		} else if (sym == 'y') {
			setWall(x, GRID_HEIGHT - y, 'horizontal', lineId);
		} else if (sym == 'xy') {
			setWall(GRID_WIDTH - x - 1, y, 'horizontal', lineId);
			setWall(x, GRID_HEIGHT - y, 'horizontal', lineId);
			setWall(GRID_WIDTH - x - 1, GRID_HEIGHT - y, 'horizontal', lineId);
		}
	} else {
		setWall(x, y, 'vertical', lineId);
		if (sym == 'x') {
			setWall(GRID_WIDTH - x, y, 'vertical', lineId);
		} else if (sym == 'y') {
			setWall(x, GRID_HEIGHT - y - 1, 'vertical', lineId);
		} else if (sym == 'xy') {
			setWall(GRID_WIDTH - x, y, 'vertical', lineId);
			setWall(x, GRID_HEIGHT - y - 1, 'vertical', lineId);
			setWall(GRID_WIDTH - x, GRID_HEIGHT - y - 1, 'vertical', lineId);
		}
	}
};

const buildWalls = () => {
	setWall(4, 1, 'horizontal', 'xy', 'L1');
	setWall(5, 1, 'horizontal', 'xy', 'L1');
	setWall(3, 1, 'vertical', 'x', 'L2');
	setWall(3, 2, 'vertical', 'x', 'L2');
	setWall(4, 3, 'horizontal', 'xy', 'L3');
	setWall(4, 4, 'horizontal', 'xy', 'L3');
	setWall(5, 4, 'vertical', 'xy', 'L4');
	setWall(5, 5, 'vertical', 'xy', 'L4');
	setWall(4, 5, 'horizontal', 'xy', 'L5');
	setWall(5, 5, 'horizontal', 'xy', 'L5');

	//	setSymmetricWall(, , 'horizontal', 'xy', 'L');
	//	setSymmetricWall(, , 'vertical', 'xy', 'L');
	// Ghost House
	setWall(25, 2, 'horizontal', 'GH_TOP');
	setWall(27, 2, 'horizontal', 'GH_TOP');
	setWall(25, 4, 'horizontal', 'GH_BOTTOM');
	setWall(26, 4, 'horizontal', 'GH_BOTTOM');
	setWall(27, 4, 'horizontal', 'GH_BOTTOM');
	setWall(25, 3, 'vertical', 'GH_LEFT');
	setWall(28, 3, 'vertical', 'GH_RIGHT');
	setWall(25, 2, 'vertical', 'GH_LEFT');
	setWall(28, 2, 'vertical', 'GH_RIGHT');
};

export const Grid = {
	buildWalls
};
