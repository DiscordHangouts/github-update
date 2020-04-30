const Constants = {
	DEFAULTS: {
		source: 'github',
		rawURL: 'raw.githubusercontent.com',
		baseURL: 'codeload.github.com',
		repo: 'user/repo',
		branch: 'master',
		packageFile: 'package.json',
		localPath: '/repo',
		privateKey: '',
		projectID: '',
		packages: '',
		runAfterInstall: '',
		debug: false
	},
	SEMVER: /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?)?)?$/i
};

module.exports = Constants;
