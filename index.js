'use strict';

const fs = require('fs');
const dirname = require('path').dirname;

const nodeBuiltins = require('builtin-modules/static');
const detective = require('detect-import-require');
const pify = require('pify');
const resolveFrom = require('resolve-from');
const diff = require('arr-diff');

const electronBuiltins = require('./modules/electron-builtins');

const readFile = pify(fs.readFile);
const builtins = electronBuiltins.concat(nodeBuiltins);

function removeBuiltins(results) {
	return diff(results, builtins);
}

function detectRequires(source) {
	return detective(source);
}

function detectRequiresFrom(filename) {
	return readFile(filename, 'utf8')
		.then(detectRequires);
}

const resolveRequiresFrom = dir => modules => {
	return modules.map(m => resolveFrom(dir, m));
};

function resolveRequiresIn(entryPoint) {
	const dir = dirname(entryPoint);

	return detectRequiresFrom(entryPoint)
		.then(removeBuiltins)
		.then(resolveRequiresFrom(dir));
}

module.exports = {
	resolveRequiresIn,
	detectRequires,
	detectRequiresFrom,
	removeBuiltins,
	resolveRequiresFrom
};
