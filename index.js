'use strict';
const path = require('path');
const globby = require('globby');
const isPathCwd = require('is-path-cwd');
const isPathInCwd = require('is-path-in-cwd');
const pify = require('pify');
const rimraf = require('rimraf');

const rimrafP = pify(rimraf);

function safeCheck(file) {
	if (isPathCwd(file)) {
		throw new Error('Cannot delete the current working directory. Can be overriden with the `force` option.');
	}

	if (!isPathInCwd(file)) {
		throw new Error('Cannot delete files/folders outside the current working directory. Can be overriden with the `force` option.');
	}
}

module.exports = (patterns, opts) => {
	opts = Object.assign({}, opts);

	const force = opts.force;
	delete opts.force;

	const dryRun = opts.dryRun;
	delete opts.dryRun;

	return globby(patterns, opts).then(files => {
		return Promise.all(files.map(file => {
			if (!force) {
				safeCheck(file);
			}

			file = path.resolve(opts.cwd || '', file);

			if (dryRun) {
				return Promise.resolve(file);
			}

			return rimrafP(file, {glob: false}).then(() => file);
		}));
	});
};

module.exports.sync = (patterns, opts) => {
	opts = Object.assign({}, opts);

	const force = opts.force;
	delete opts.force;

	const dryRun = opts.dryRun;
	delete opts.dryRun;

	return globby.sync(patterns, opts).map(file => {
		if (!force) {
			safeCheck(file);
		}

		file = path.resolve(opts.cwd || '', file);

		if (!dryRun) {
			rimraf.sync(file, {glob: false});
		}

		return file;
	});
};
