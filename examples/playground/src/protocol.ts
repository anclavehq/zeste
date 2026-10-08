/** Messages exchanged between the demo (in an iframe) and the page hosting it. */
export interface PlaygroundConfig {
	lib: 'bits' | 'ark' | 'shadcn';
	style: 'zeste' | 'pelure';
	theme: 'light' | 'dark';
	/** Shrinks "Deny all" to demonstrate the compliance guard. */
	broken: boolean;
}

export type LogKind = 'ok' | 'deny' | 'info' | 'warn';

export type FromPlayground =
	| { source: 'zeste-playground'; type: 'ready' }
	| { source: 'zeste-playground'; type: 'log'; kind: LogKind; text: string };

export type ToPlayground = { source: 'zeste-host'; type: 'config'; config: PlaygroundConfig };

export const DEFAULT_CONFIG: PlaygroundConfig = { lib: 'bits', style: 'zeste', theme: 'light', broken: false };

export function log(kind: LogKind, text: string): void {
	const message: FromPlayground = { source: 'zeste-playground', type: 'log', kind, text };
	if (window.parent !== window) window.parent.postMessage(message, '*');
	else console.info(`[${kind}] ${text}`);
}
