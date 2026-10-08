import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { DEFAULT_CONFIG, log, type FromPlayground, type PlaygroundConfig, type ToPlayground } from './protocol.ts';

// compliance guard warnings are also sent to the host page's log.
const warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
	warn(...args);
	const text = String(args[0]);
	if (text.startsWith('[zeste/consent]')) log('warn', text.replace('[zeste/consent] ', '').split('\n')[0]!);
};

let started = false;
function start(config: PlaygroundConfig) {
	if (started) return;
	started = true;
	document.documentElement.classList.toggle('dark', config.theme === 'dark');
	if (config.broken) {
		const style = document.createElement('style');
		style.textContent = '[data-zeste-action="denyAll"] { font-size: 9px !important; padding: 2px 6px !important; }';
		document.head.append(style);
	}
	mount(App, { target: document.getElementById('app')!, props: { config } });
}

addEventListener('message', (event: MessageEvent<ToPlayground>) => {
	if (event.source === window.parent && event.data?.source === 'zeste-host' && event.data.type === 'config') {
		start(event.data.config);
	}
});

if (window.parent !== window) {
	const ready: FromPlayground = { source: 'zeste-playground', type: 'ready' };
	window.parent.postMessage(ready, '*');
} else {
	// Opened standalone (dev): default configuration, or via ?lib=ark&style=pelure&theme=dark
	const params = new URLSearchParams(location.search);
	start({
		lib: (params.get('lib') as PlaygroundConfig['lib']) ?? DEFAULT_CONFIG.lib,
		style: (params.get('style') as PlaygroundConfig['style']) ?? DEFAULT_CONFIG.style,
		theme: (params.get('theme') as PlaygroundConfig['theme']) ?? DEFAULT_CONFIG.theme,
		broken: params.has('broken')
	});
}
