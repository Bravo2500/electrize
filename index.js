'use strict';

const fs = require('fs');
const detective = require('detect-import-require');
const pify = require('pify');
const readFile = pify(fs.readFile);

function detectRequires(source) {
	return detective(source);
}

function detectRequiresFrom(filename) {
	return readFile(filename, 'utf8')
		.then(source => detective(source));
}

module.exports = {detectRequires, detectRequiresFrom};
