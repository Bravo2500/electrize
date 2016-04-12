const resolve = require('path').resolve;
const relative = require('path').relative;
const fs = require('fs');

const pify = require('pify');
const readFile = pify(fs.readFile);
const brfs = require('brfs');
const rimraf = pify(require('rimraf'));
const touch = pify(require('touch'));
const test = require('ava');
const electrize = require('./');

test('detectRequires - return array of required modules given filename.', async (t) => {
	const result = await electrize.detectRequires('./fixtures/test.js');
	t.deepEqual(result, ['a-module', 'another-one']);
});

test('resolveRequiresFrom - relative imports are resolved relative to file', async (t) => {
	const dir = resolve(__dirname, 'fixtures');

	const result = await electrize.resolveRequiresFrom(dir)(['./file2', 'file3']);
	t.deepEqual(result, [
		resolve(__dirname, 'fixtures/file2.js'),
		resolve(__dirname, 'fixtures/node_modules/file3/index.js')
	]);
});

test('detectRequiresDeep - recursively resolve imports from entry point', async (t) => {
	const result = await electrize.detectRequiresDeep(resolve(__dirname, 'fixtures/test3.js'));
	t.deepEqual(
		result.map(f => relative(__dirname, f)),
		['fixtures/test3.js', 'fixtures/test2.js',
		'fixtures/file2.js', 'fixtures/node_modules/file3/index.js']
	);
});

test('detectRequiresDeep - handles circular deps', async (t) => {
	const result = await electrize.detectRequiresDeep(resolve(__dirname, 'fixtures/circular.js'));
	t.deepEqual(
		result.map(f => relative(__dirname, f)),
		['fixtures/circular.js', 'fixtures/circuled.js']
	);
});

test('resolveRequiresIn - return array of all used files from entry point.', async (t) => {
	const result = await electrize.resolveRequiresIn('./fixtures/test2.js');
	t.deepEqual(
		result.map(f => relative(__dirname, f)),
		['fixtures/file2.js', 'fixtures/node_modules/file3/index.js']);
});

test('removeBuiltins - remove electron & node builtins from array of module.', t => {
	const result = electrize.removeBuiltins(['ava', 'browser-window', 'xo', 'fs']);
	t.deepEqual(result, ['ava', 'xo']);
});

test('electrize - copy all files to target folder', async (t) => {
	await rimraf(resolve('dist/test1'));
	const result = await electrize(
		resolve(__dirname, 'fixtures/test3.js'),
		{outputFolder: resolve(__dirname, 'dist/test1')}
	);
	t.deepEqual(
		result,
		[{'test3.js': 'new'},
		{'test2.js': 'new'},
		{'file2.js': 'new'},
		{'node_modules/file3/index.js': 'new'}]
	);
});

test('electrize - upgraded all files in target folder if changed, or skip them', async (t) => {
	await rimraf(resolve('dist/test2'));
	await electrize(
		resolve(__dirname, 'fixtures/test3.js'),
		{outputFolder: resolve(__dirname, 'dist/test2')}
	);
	await touch(resolve('fixtures/test3.js'));
	const result = await electrize(
		resolve(__dirname, 'fixtures/test3.js'),
		{outputFolder: 'dist/test2'}
	);
	t.deepEqual(
		result,
		[{'test3.js': 'changed'},
		{'test2.js': 'skipped'},
		{'file2.js': 'skipped'},
		{'node_modules/file3/index.js': 'skipped'}]
	);
});

test('electrize - emit an event on each electrize module', async (t) => {
	await rimraf(resolve('dist/test3'));
	const events = [];
	await electrize(
		resolve(__dirname, 'fixtures/test3.js'),
		{
			outputFolder: resolve(__dirname, 'dist/test3'),
			callback: m => events.push(m)
		}
	);

	events.sort((a, b) => {
		if (Object.keys(a)[0] === Object.keys(b)[0]) {
			return 0;
		}
		return Object.keys(a)[0] < Object.keys(b)[0] ? -1 : 1;
	});
	t.deepEqual(
		events,
		[{'file2.js': 'new'},
		{'node_modules/file3/index.js': 'new'},
		{'test2.js': 'new'},
		{'test3.js': 'new'}]
	);
});

test('electrize - support browserify transforms', async (t) => {
	await rimraf(resolve('dist/test4'));
	await electrize(
		resolve(__dirname, 'fixtures/brfsed.js'),
		{
			outputFolder: resolve(__dirname, 'dist/test4'),
			transformers: [brfs]
		}
	);

	const content = await readFile(resolve(__dirname, 'dist/test4/brfsed.js'), 'utf8');
	t.is(
		content,
		'\nconst test = "this is a test\\n";\n'
	);
});

