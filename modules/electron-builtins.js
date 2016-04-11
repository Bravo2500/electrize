'use strict';

module.exports = [
	// API root
	'electron',

	// common modules
	'clipboard',
	'crash-reporter',
	'deprecations',
	'nativeImage',
	'shell',

	// browser-side modules
	'app',
	'auto-updater',
	'browser-window',
	'content-tracing',
	'dialog',
	'ipc-main',
	'global-shortcut',
	'menu',
	'menu-item',
	'power-monitor',
	'power-save-blocker',
	'protocol',
	'screen',
	'session',
	'tray',
	'navigation-controller',
	'web-contents',

	// Renderer side modules
	'desktop-capturer',
	'ipc-renderer',
	'remote',
	'screen',
	'web-frame'
];
