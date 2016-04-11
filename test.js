const resolve = require('path').resolve;
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

test('detectRequiresFrom - relative imports are resolved relative to file', async (t) => {
	const result = await electronify.detectRequiresFrom('./fixtures/test2.js');
	t.deepEqual(result, [resolve(__dirname, 'fixtures/file2.js')]);
});

test('removeBuiltins - remove electron & node builtins from array of module.', async (t) => {
	const result = electronify.removeBuiltins(['ava', 'browser-window', 'xo', 'fs']);
	t.deepEqual(result, ['ava', 'xo']);
});
