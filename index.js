'use strict';

const fs = require('fs');
const dirname = require('path').dirname;
const resolve = require('path').resolve;
const relative = require('path').relative;

const nodeBuiltins = require('builtin-modules/static');
const detective = require('detect-import-require');
const co = require('co');
const pify = require('pify');
const resolveFrom = require('resolve-from');
const diff = require('arr-diff');
const pathType = require('path-type');
const _pump = require('pump');

const electronBuiltins = require('./modules/electron-builtins');

const createReadStream = fs.createReadStream;
const createReadStream = fs.createReadStream;
const createWriteStream = fs.createWriteStream;
const readFile = pify(fs.readFile);
const mkDir = pify(fs.mkDir);
const pump = pify(_pump);
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
	yield modules.map(m => resolveAllRequiresFrom(m, _results));
	return _results;
}

function * _electronify(entrypoint, options) {
	const _options = options || {};
	const modules = yield resolveAllRequiresFrom(entrypoint);
	const outputFolder = _options.outputFolder || resolve('dist');
	const inputFolder = _options.outputFolder || dirname(entrypoint);

	if (!(yield pathType.dir(outputFolder))) {
		yield mkDir(pathType);
	}

	const copyProcesses = modules.map(mod => {
		const input = relative(inputFolder, mod);
		const output = resolve(outputFolder, input);
		const inputStream = createReadStream(input);
		const outputStream = createWriteStream(output);
		return pump(inputStream, outputStream);
	});
	return yield copyProcesses;
}

const electronify = module.exports = co.wrap(_electronify);

Object.assign(electronify, {
	resolveAllRequiresFrom: co.wrap(resolveAllRequiresFrom),
	resolveRequiresIn: co.wrap(resolveRequiresIn),
	detectRequires,
	detectRequiresFrom: co.wrap(detectRequiresFrom),
	removeBuiltins,
	resolveRequiresFrom
});
