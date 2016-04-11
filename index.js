'use strict';

const fs = require('fs');
const dirname = require('path').dirname;

const nodeBuiltins = require('builtin-modules/static');
const detective = require('detect-import-require');
const co = require('co');
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

function * detectRequiresFrom(filename) {
	const content = yield readFile(filename, 'utf8');
	return detectRequires(content);
}

const resolveRequiresFrom = dir => modules => {
	return modules.map(m => resolveFrom(dir, m));
};

function * resolveRequiresIn(entryPoint) {
	const resolveRequires = resolveRequiresFrom(dirname(entryPoint));

	const modules = yield detectRequiresFrom(entryPoint);
	const userLandModules = removeBuiltins(modules);
	return resolveRequires(userLandModules);
}

function * resolveAllRequiresFrom(entryPoint, results) {
	const _results = results || [];
	if (_results.indexOf(entryPoint) !== -1) {
		return [];
	}
	_results.push(entryPoint);
	const modules = yield resolveRequiresIn(entryPoint);
	for (const m of modules) {
		yield resolveAllRequiresFrom(m, _results);
	}
	return _results;
}

module.exports = {
	resolveAllRequiresFrom: co.wrap(resolveAllRequiresFrom),
	resolveRequiresIn: co.wrap(resolveRequiresIn),
	detectRequires,
	detectRequiresFrom: co.wrap(detectRequiresFrom),
	removeBuiltins,
	resolveRequiresFrom
};
