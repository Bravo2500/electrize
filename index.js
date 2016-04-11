'use strict';

const fs = require('fs');

const nodeBuiltins = require('builtin-modules/static');
const detective = require('detect-import-require');
const pify = require('pify');
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
		.then(source => detective(source));
}

module.exports = {
	detectRequires,
	detectRequiresFrom,
	removeBuiltins
};
