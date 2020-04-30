/* eslint-disable new-cap */
const url = require('url');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { Extract } = require('unzipper');
const fs = require('fs-nextra');

const { DEFAULTS, SEMVER } = require('./Constants');

class GithubUpdater {

	constructor(options) {
		this.options = Object.assign(DEFAULTS, options);
		this.sources = {
			github: {
				rawfile: `https://${this.options.rawURL}/${this.options.repo}/${this.options.branch}/${this.options.packageFile}`,
				download: `https://${this.options.baseURL}/${this.options.repo}/zip/${this.options.branch}`
			},
			gitlab: {
				rawfile: `https://${this.options.rawURL}/${this.options.repo}/raw/${this.options.branch}/${this.options.packageFile}`,
				download: `https://${this.options.rawURL}/api/v4/projects/${this.options.projectID}/repository/archive.zip`
			}
		};

		if (this.options.privateKey) {
			this.sources.gitlab.rawfile += `?private_token=${this.options.privateKey}`;
			this.sources.gitlab.download += `?private_token=${this.options.privateKey}`;
			if (this.options.debug) console.log(`[Github Updater] Setting the gitlab private key...`);
		}

		if (this.options.debug) console.log(`[Github Updater] Printing used options...\n${JSON.stringify(this.options)}`);
		if (!url.parse(this.options.rawURL)) throw `${this.options.rawURL} as a Raw URL is not valid!`;
		if (!url.parse(this.options.baseURL)) throw `${this.options.baseURL} as a Base URL is not valid!`;


		if (!fs.pathExists(this.options.localPath)) {
			if (this.options.debug) console.log(`[Github Updater] Creating ${this.options.localPath} because it does not exist yet.`);
			fs.mkdir(this.options.localPath);
		}
	}

	compareVersions(packageOne, packageTwo) {
		[packageOne, packageTwo].forEach((version) => typeof version === 'string' && SEMVER.test(version) ? true : new Error('Invalid argument, argument not valid'));

		const s1 = this.split(packageOne);
		const s2 = this.split(packageTwo);

		for (var i = 0; i < Math.max(s1.length - 1, s2.length - 1); i++) {
			var n1 = parseInt(s1[i] || 0, 10);
			var n2 = parseInt(s2[i] || 0, 10);

			if (n1 > n2) return 1;
			if (n2 > n1) return -1;
		}

		var sp1 = s1[s1.length - 1];
		var sp2 = s2[s2.length - 1];

		if (sp1 && sp2) {
			var p1 = sp1.split('.').map((ver) => isNaN(Number(ver)) ? ver : Number(ver));
			var p2 = sp2.split('.').map((ver) => isNaN(Number(ver)) ? ver : Number(ver));

			for (i = 0; i < Math.max(p1.length, p2.length); i++) {
				if (p1[i] === undefined || (typeof p2[i] === 'string' && typeof p1[i] === 'number')) return -1;
				if (p2[i] === undefined || (typeof p1[i] === 'string' && typeof p2[i] === 'number')) return 1;

				if (p1[i] > p2[i]) return 1;
				if (p2[i] > p1[i]) return -1;
			}
		} else if (sp1 || sp2) {
			return sp1 ? -1 : 1;
		}

		return 0;
	}

	split(version) {
		const char = version.replace(/^v/, '').replace(/\+.*$/, '');
		const patchIndex = char.indexOf('-') === -1 ? char.length : char.indexOf('-');
		const arr = char.substring(0, patchIndex).split('.');
		arr.push(char.substring(patchIndex + 1));
		return arr;
	}

	getFolder(paths) {
		return fs.readdir(paths).filter((file) => fs.stat(path.join(paths, file)).isDirectory());
	}

	async checkVersion(callback) {
		const source = this.sources[this.options.source];

		if (!fs.pathExists(this.options.localPath)) {
			if (this.options.debug) console.log(`[Github Updater] Creating ${this.options.localPath} because it does not exist yet.`);
			fs.mkdir(this.options.localPath);
		}

		let packageFile;
		try {
			packageFile = JSON.parse(fs.readFileSync(`${this.options.localPath}/${this.options.packageFile}`));
		} catch (ex) {
			packageFile = { version: '0.0.0' };
		}

		if (this.options.debug) console.log(`[Github Updater] Found local package version to be: ${packageFile.version}\n[Github Updater] Starting update & Getting ${source.rawfile}`);
		https.get(source.rawfile, (response) => {
			let data = '';

			if (this.options.debug) console.log(`[Github Updater] Got Status: ${response.statusCode}.`);
			if (response.statusCode !== 200) return callback(response.statusCode, null);

			response.on('data', (dataChunk) => {
				data += dataChunk;
			});

			return response.on('end', () => {
				const parsedData = JSON.parse(data);
				if (this.options.debug) console.log('[Github Updater] Update check finished.');
				const uptodate = this.compareVersions(parsedData.version, packageFile.version);
				if (this.options.debug) console.log(`[Github Updater] Local repository is ${uptodate ? 'out of date.' : 'up to date.'}`);
				return callback(null, uptodate);
			});
		}).on('error', (err) => callback(err.null, null));
	}

	async updateRepository(callback) {
		if (this.options.debug) console.log(`[Github Updater] Starting update job...`);

		const source = this.sources[this.options.source];
		const tempFolder = './github-updater-temp';

		if (!fs.pathExists(tempFolder)) {
			if (this.options.debug) console.log(`[Github Updater] Creating ${this.options.localPath} because it does not exist yet.`);
			fs.mkdir(tempFolder);
		}

		if (this.options.debug) console.log(`[Github Updater] Getting: ${source.download}`);

		const downloadRepo = fs.createWriteStream(`${tempFolder}/repo.zip`);
		https.get(source.download, (response) => {
			response.pipe(downloadRepo);
		});

		downloadRepo.on('finish', () => {
			downloadRepo.close(() => {
				if (this.options.debug) console.log(`[Github Updater] Unzipping repository...`);
				const unzipRepo = fs.createReadStream(`${tempFolder}/repo.zip`);
				unzipRepo.pipe(Extract({ path: `${tempFolder}/repo` }))
					.on('close', async () => {
						const folders = this.getFolder(`${tempFolder}/repo`);
						folders.forEach(async (fold) => {
							await this.copyFolder({ tempFolder, fold });
							if (String(this.options.packages).toLowerCase() === 'npm' || String(this.options.packages).toLowerCase() === 'yarn') await this.runInstall(callback);
							if (this.options.runScript) await this.runScript(callback);
							return callback(true, null);
						});
					});
			});
		}).on('error', (err) => {
			fs.unlink(`${tempFolder}/repo.zip`);
			return callback(err.message);
		});
	}

	async copyFolder({ tempFolder, fold }) {
		if (this.options.debug) console.log(`[Github Updater] Moving ${tempFolder}/repo/${fold} to ${this.options.localPath}`);
		await fs.copy(`./${tempFolder}/repo/${fold}`, this.options.localPath, async (err) => {
			if (err) return console.error(err);
			if (this.options.debug) console.log(`[Github Updater] Deleting github-updater-temp folder...`);
			return fs.remove(tempFolder);
		});
	}

	async runInstall(callback) {
		if (this.options.debug) console.log(`[Github Updater] Executing '${String(this.options.packages).toLowerCase()}' install' in '${this.options.localPath}'`);
		execSync(`${String(this.options.packages).toLowerCase()} install`, { cwd: `${this.options.localPath}/` }, (error, stdout, stderr) => {
			if (error) return callback(false, error);
			if (this.options.debug) console.log(stdout);
			if (this.options.debug) console.log(stderr);
			return console.log(`[Github Updater] Finished installing dependencies ...`);
		});
		return true;
	}

	runScript(callback) {
		if (this.options.debug) console.log(`[Github Updater] Running NPM Scripts...`);
		execSync(`npm run ${this.options.runScript}`, { cwd: `${this.options.localPath}/` }, (error, stdout, stderr) => {
			if (error) return callback(false, error);
			if (this.options.debug) console.log(stdout);
			if (this.options.debug) console.log(stderr);
			return console.log(`[Github Updater] Finished running NPM Scripts...`);
		});
		return true;
	}


}

module.exports = GithubUpdater;
