const resolve = require('path').resolve;
const relative = require('path').relative;

const test = require('ava');
const electronify = require('./');

test('detectRequires - return array of required modules.', t => {
	const result = electronify.detectRequires('require("a-module"); import "./another-one";');
	t.deepEqual(result, ['a-module', './another-one']);
});

test('detectRequiresFrom - return array of required modules given filename.', async (t) => {
	const result = await electronify.detectRequiresFrom('./fixtures/test.js');
	t.deepEqual(result, ['a-module', 'another-one']);
});

test('resolveRequiresFrom - relative imports are resolved relative to file', async (t) => {
	const dir = resolve(__dirname, 'fixtures');

	const result = await electronify.resolveRequiresFrom(dir)(['./file2', 'file3']);
	t.deepEqual(result, [
		resolve(__dirname, 'fixtures/file2.js'),
		resolve(__dirname, 'fixtures/node_modules/file3/index.js')
	]);
});

test('detectUsedFiles - return array of all used files from entry point.', async (t) => {
	const result = await electronify.detectUsedFiles('./fixtures/test2.js');
	t.deepEqual(
		result.map(f => relative(__dirname, f)),
		['fixtures/file2.js', 'fixtures/node_modules/file3/index.js']);
});

test('removeBuiltins - remove electron & node builtins from array of module.', t => {
	const result = electronify.removeBuiltins(['ava', 'browser-window', 'xo', 'fs']);
	t.deepEqual(result, ['ava', 'xo']);
});
