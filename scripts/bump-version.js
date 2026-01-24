
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Increment patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

packageJson.version = newVersion;

// Write new version to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t') + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);

try {
	// Git operations
	console.log('Creating git commit and tag...');

	// Add package.json
	execSync('git add package.json', { stdio: 'inherit' });

	// Commit
	execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });

	// Tag
	execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });

	console.log(`\nSUCCESS! v${newVersion} created.`);
	console.log(`Now run the following command to publish to GitHub:`);
	console.log(`\n    git push && git push --tags\n`);

} catch (error) {
	console.error('Error during git operations:', error.message);
	console.log('The version was bumped in package.json, but git operations failed.');
	process.exit(1);
}
