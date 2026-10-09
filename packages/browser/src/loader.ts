/*
 * The script to put in <head>, in place of tarteaucitron.js. A classic script, so that it runs before the
 * page's own scripts: a configuration written for tarteaucitron (tarteaucitron.init, tarteaucitron.user,
 * tarteaucitron.job) is captured as is and keeps working. Then it loads zeste, next to this file.
 */
export interface Captured {
  __zesteCapture: true;
  user: Record<string, unknown>;
  job: string[];
  params?: Record<string, unknown>;
  init(params?: Record<string, unknown>): void;
}

const globals = window as typeof window & { tarteaucitron?: unknown };

if (!globals.tarteaucitron) {
  const captured: Captured = {
    __zesteCapture: true,
    user: {},
    job: [],
    init(params) {
      captured.params = params ?? {};
    },
  };
  globals.tarteaucitron = captured;
}

const app = document.createElement('script');
app.type = 'module';
app.src = new URL('zeste.app.js', (document.currentScript as HTMLScriptElement | null)?.src ?? location.href).href;
document.head.append(app);
