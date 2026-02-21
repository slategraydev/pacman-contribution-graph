import * as core from '@actions/core';
import * as fs from 'fs';
import { PacmanRenderer } from '../../src/index';
import * as path from 'path';

const generateSvg = async (userName, githubToken, theme, playerStyle) => {
	return new Promise((resolve, reject) => {
		let generatedSvg = '';
		const conf = {
			platform: 'github',
			username: userName,
			outputFormat: 'svg',
			gameSpeed: 1,
			gameTheme: theme,
			playerStyle,
			githubSettings: {
				accessToken: githubToken
			},
			svgCallback: (svg) => {
				generatedSvg = svg;
			},
			gameOverCallback: () => {
				resolve(generatedSvg);
			}
		};

		const renderer = new PacmanRenderer(conf);
		renderer.start();
	});
};

(async () => {
	try {
		let svgContent = '';
		const userName = core.getInput('github_user_name');
		const githubToken = core.getInput('github_token');

		// --- BRAIN PERSISTENCE ---
		const brainPath = 'pacman-brain.json';
		let brain = undefined;
		if (fs.existsSync(brainPath)) {
			try {
				brain = JSON.parse(fs.readFileSync(brainPath, 'utf8'));
				console.log(`🧠 Brain loaded: Generation ${brain.generation}`);
			} catch (e) {
				console.warn('⚠️ Could not parse brain.json, starting fresh.');
			}
		}

		// TODO: Check active users
		fetch('https://elec.abozanona.me/github-action-analytics.php?username=' + userName);

		const generateWithBrain = async (theme) => {
			return new Promise((resolve) => {
				let generatedSvg = '';
				let updatedBrain = undefined;

				const conf = {
					platform: 'github',
					username: userName,
					outputFormat: 'svg',
					gameSpeed: 1,
					gameTheme: theme,
					brain: brain, // Pass the loaded brain
					githubSettings: { accessToken: githubToken },
					svgCallback: (svg) => (generatedSvg = svg),
					gameOverCallback: () => resolve({ svg: generatedSvg, brain: updatedBrain })
				};

				const renderer = new PacmanRenderer(conf);
				renderer.start().then((store) => {
					updatedBrain = store.config.brain;
				});
			});
		};

		// Run for Light Theme
		const lightResult = await generateWithBrain('github');
		svgContent = lightResult.svg;
		brain = lightResult.brain; // Update brain from the first run's evolution

		console.log(`💾 writing to dist/pacman-contribution-graph.svg`);
		fs.mkdirSync(path.dirname('dist/pacman-contribution-graph.svg'), { recursive: true });
		fs.writeFileSync('dist/pacman-contribution-graph.svg', svgContent);

		// Run for Dark Theme (reuse evolved brain)
		const darkResult = await generateWithBrain('github-dark');
		svgContent = darkResult.svg;

		console.log(`💾 writing to dist/pacman-contribution-graph-dark.svg`);
		fs.mkdirSync(path.dirname('dist/pacman-contribution-graph-dark.svg'), { recursive: true });
		fs.writeFileSync('dist/pacman-contribution-graph-dark.svg', svgContent);

		// --- SAVE UPDATED BRAIN ---
		if (brain) {
			fs.writeFileSync(brainPath, JSON.stringify(brain, null, 2));
			console.log(`🧠 Brain saved: Generation ${brain.generation}`);
		}
	} catch (e) {
		core.setFailed(`Action failed with "${e.message}"`);
	}
})();
