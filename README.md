# github-version-updater
Compares package.json version numbers and downloads new release if available.

## Original Developer
This is a forked version of Nioxed's github-updater. All original credit goes to him.
Github-Version-Updater has been rewritten for better code quality and is up to date with no vulnerabilities.

See here: https://www.npmjs.com/package/github-update
See here: https://github.com/Nioxed/github-update

## Usage
Using the **check** and **update** methods you can quickly create a simple update script.
```js
const GithubUpdater = require('github-update');
const gitupdate = new GithubUpdater({ repo: 'DiscordHangouts/Translations', localPath: './languages' });
```

## updater.check
```js    
const GithubUpdater = require('github-update');
const gitupdate = new GithubUpdater({ repo: 'DiscordHangouts/Translations', localPath: './languages' });
// Check if we're up to date.
gitupdate.checkVersion((err, uptodate) => {
	if (err) throw err;

	if (!uptodate) {
        console.log(`Localization is not up to date.`);
	} else {
		console.log(`Localization is up to date.`);
	}
});
```
## updater.update
```js    
const GithubUpdater = require('github-update');
const gitupdate = new GithubUpdater({ repo: 'DiscordHangouts/Translations', localPath: './languages' });
// Download latest version of the repo and extract it.
gitupdate.updateRepository((success, error) => {
	if (!success) throw error;
	console.log(`${prefix}Successfully updated the localization.`);
});
```

## Options
When requiring the module you need to feed in an options object.

Below is the default config object, The object you supply will override these values. (All values are optional, Their default value will be used if you don't supply it.)
```js
const DEFAULTS = {

    // 'github' or 'gitlab'
    source: 'github',
    
    // if using gitlab, set to 'gitlab.com'
    rawURL: 'raw.githubusercontent.com',
    
    // if using gitlab, set to 'gitlab.com'
    baseURL: 'codeload.github.com',
    
    // The repo we want to check. ( Username/RepoName )
    repo: 'user/repo',
    
    // The branch we want to check. (Only works for github)
    branch: 'master',
    
    // The remote path of the package.json file.
    packageFile: 'package.json',
    
    // The local directory we want to download the update to.
    localPath: '/repo',
    
    // Required for private gitlab repos
    // https://gitlab.com/profile/personal_access_tokens
    privateKey: '',
    
    // Required for gitlab repos
    // (Find it on the repos settings page.)
    projectID: '',
    
    // Will run 'npm install' or 'yarn install' if filled in, if left empty none will be ran.
    // one of the following: 'npm', 'yarn' or ''
    packages: '',
    
    // Runs the npm script in package.json with this name.
    // leave at "" to not run any npm script.
    runScript: '',
    
    // Spams console.log() with whatever we're doing.
    debug: false
}
```

