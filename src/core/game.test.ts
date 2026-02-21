import { updateGame } from './game';
import { StoreType } from '../types';

// Mock all external modules used in updateGame
jest.mock('../renderers/canvas', () => ({
	Canvas: {
		drawGrid: jest.fn(),
		drawPacman: jest.fn(),
		drawGhosts: jest.fn(),
		drawSoundController: jest.fn(),
		renderGameOver: jest.fn()
	}
}));

jest.mock('../renderers/svg', () => ({
	SVG: {
		generateAnimatedSVG: jest.fn().mockReturnValue('<svg></svg>')
	}
}));

jest.mock('../music-player', () => ({
	MusicPlayer: {
		getInstance: jest.fn().mockReturnValue({
			play: jest.fn().mockResolvedValue(undefined),
			stopDefaultSound: jest.fn()
		})
	},
	Sound: { BEGINNING: 'beginning' }
}));

jest.mock('../movement/pacman-movement', () => ({
	PacmanMovement: {
		movePacman: jest.fn()
	}
}));

jest.mock('../movement/ghosts-movement', () => ({
	GhostsMovement: {
		moveGhosts: jest.fn()
	}
}));

jest.mock('../utils/utils', () => ({
	Utils: {
		getCurrentTheme: jest.fn().mockReturnValue({
			intensityColors: ['#000', '#111', '#222', '#333', '#444'],
			gridBackground: '#fff'
		})
	}
}));

describe('updateGame death logic', () => {
	let store: StoreType;

	beforeEach(() => {
		store = {
			frameCount: 0,
			contributions: [],
			pacman: {
				x: 10,
				y: 10,
				direction: 'right',
				points: 0,
				totalPoints: 0,
				deadRemainingDuration: 0,
				powerupRemainingDuration: 0,
				recentPositions: []
			},
			ghosts: [],
			grid: [[{ commitsCount: 1, color: 'green', level: 'FIRST_QUARTILE' }]],
			monthLabels: [],
			pacmanMouthOpen: true,
			gameInterval: 0,
			gameHistory: [],
			config: {
				outputFormat: 'canvas',
				gameSpeed: 1,
				gameOverCallback: jest.fn(),
				pointsIncreasedCallback: jest.fn()
			} as any,
			useGithubThemeColor: true
		};
	});

	it('should decrement deadRemainingDuration and return early', async () => {
		store.pacman.deadRemainingDuration = 5;
		const initialFrameCount = store.frameCount;

		await updateGame(store);

		expect(store.pacman.deadRemainingDuration).toBe(4);
		expect(store.frameCount).toBe(initialFrameCount); // Logic paused
		expect(store.gameHistory.length).toBe(1);
	});

	it('should reset when deadRemainingDuration reaches 0', async () => {
		store.pacman.deadRemainingDuration = 1;
		store.pacman.x = 0; // Move away from start

		await updateGame(store);

		expect(store.pacman.deadRemainingDuration).toBe(0);
		expect(store.pacman.x).toBe(26); // resetPacman sets it to 26
		expect(store.frameCount).toBe(0); // Still logic paused (this frame is the reset state)
		expect(store.gameHistory.length).toBe(1);
	});

	it('should resume logic when deadRemainingDuration is 0', async () => {
		store.pacman.deadRemainingDuration = 0;
		const initialFrameCount = store.frameCount;

		await updateGame(store);

		expect(store.frameCount).toBe(initialFrameCount + 1); // Logic resumed
	});
});
