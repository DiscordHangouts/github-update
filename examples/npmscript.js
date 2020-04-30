var options = {
	repo: 'Nioxed/github-update',
	branch: 'master',
	packageFile: 'package.json',
	localPath: './repo-npmscript',
	runScript: 'exampleScript',
	debug: true

};

var updater = require('../')(options);


updater.check((error, upToDate) => {
	if (error) { throw error; }

	if (upToDate) {
		console.log('App is up to date');
		startApp();
	} else {
		updater.update((success, err) => {
			if (!success) { throw err; }

			console.log('Updated App');
			startApp();
		});
	}
});

function startApp() {
	console.log('App Started');
	process.exit(0);
}

