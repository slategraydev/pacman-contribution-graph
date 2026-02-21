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

		// --- INTELLIGENCE PERSISTENCE ---
		const intelligencePath = 'pacman-intelligence.json';
		let intelligence = undefined;
		if (fs.existsSync(intelligencePath)) {
			try {
				intelligence = JSON.parse(fs.readFileSync(intelligencePath, 'utf8'));
				console.log(`✨ Intelligence loaded: Generation ${intelligence.generation}`);
			} catch (e) {
				console.warn('⚠️ Could not parse intelligence.json, starting fresh.');
			}
		}

		// TODO: Check active users
		fetch('https://elec.abozanona.me/github-action-analytics.php?username=' + userName);

		const generateWithIntelligence = async (theme, runEvolution) => {
			return new Promise((resolve) => {
				let generatedSvg = '';
				let updatedIntelligence = undefined;

				const conf = {
					platform: 'github',
					username: userName,
					outputFormat: 'svg',
					gameSpeed: 1,
					gameTheme: theme,
					intelligence: intelligence, // Pass the current intelligence
					runEvolution: runEvolution, // Only evolve on the first run
					githubSettings: { accessToken: githubToken },
					svgCallback: (svg) => (generatedSvg = svg),
					gameOverCallback: () => resolve({ svg: generatedSvg, intelligence: updatedIntelligence })
				};

				const renderer = new PacmanRenderer(conf);
				renderer.start().then((store) => {
					updatedIntelligence = store.config.intelligence;
				});
			});
		};

		// Run for Light Theme (WITH evolution)
		const lightResult = await generateWithIntelligence('github', true);
		svgContent = lightResult.svg;
		intelligence = lightResult.intelligence; // Store the newly evolved intelligence

		console.log(`💾 writing to dist/pacman-contribution-graph.svg`);
		fs.mkdirSync(path.dirname('dist/pacman-contribution-graph.svg'), { recursive: true });
		fs.writeFileSync('dist/pacman-contribution-graph.svg', svgContent);

		// Run for Dark Theme (WITHOUT further evolution, reuse lightResult's intelligence)
		const darkResult = await generateWithIntelligence('github-dark', false);
		svgContent = darkResult.svg;

		console.log(`💾 writing to dist/pacman-contribution-graph-dark.svg`);
		fs.mkdirSync(path.dirname('dist/pacman-contribution-graph-dark.svg'), { recursive: true });
		fs.writeFileSync('dist/pacman-contribution-graph-dark.svg', svgContent);

		// --- SAVE UPDATED INTELLIGENCE ---
		if (intelligence) {
			fs.writeFileSync(intelligencePath, JSON.stringify(intelligence, null, 2));
			console.log(`✨ Intelligence saved: Generation ${intelligence.generation}`);
		}
	} catch (e) {
		core.setFailed(`Action failed with "${e.message}"`);
	}
})();
