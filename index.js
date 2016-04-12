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
const _mkdirp = require('mkdirp');

const electronBuiltins = require('./modules/electron-builtins');

const createReadStream = fs.createReadStream;
const createWriteStream = fs.createWriteStream;
const readFile = pify(fs.readFile);
const stat = pify(fs.stat);
const mkdirp = pify(_mkdirp);
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

const electronifyModule = (inputFolder, outputFolder) => co.wrap(function * (mod) {
	const input = relative(inputFolder, mod);
	const output = resolve(outputFolder, input);
	yield mkdirp(dirname(output));
	const inputStat = yield stat(mod);

	let state = null;
	try {
		const outputStat = yield stat(output);
		if (outputStat.ctime < inputStat.ctime) {
			state = 'changed';
		} else {
			state = 'skipped';
		}
	} catch (err) {
		if (err.code === 'ENOENT') {
			state = 'new';
		}
	}

	const inputStream = createReadStream(mod);
	const outputStream = createWriteStream(output);
	yield pump(inputStream, outputStream);
	return {[input]: state};
});

function * electronify(entrypoint, options) {
	const _options = options || {};
	const modules = yield resolveAllRequiresFrom(entrypoint);
	const outputFolder = _options.outputFolder || resolve('dist');
	const inputFolder = _options.inputFolder || dirname(entrypoint);

	let isDir = true;
	try {
		isDir = yield pathType.dir(outputFolder);
	} catch (err) {
		yield mkdirp(outputFolder);
		isDir = true;
	}

	if (!isDir) {
		throw new Error('Output folder exists and is not a directory.');
	}

	const electronifyProcess = modules.map(
		electronifyModule(inputFolder, outputFolder)
	);
	return yield electronifyProcess;
}

module.exports = Object.assign(co.wrap(electronify), {
	resolveAllRequiresFrom: co.wrap(resolveAllRequiresFrom),
	resolveRequiresIn: co.wrap(resolveRequiresIn),
	detectRequires,
	detectRequiresFrom: co.wrap(detectRequiresFrom),
	removeBuiltins,
	resolveRequiresFrom
});
