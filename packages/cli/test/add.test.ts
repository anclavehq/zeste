import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { add, detectUi } from '../src/add.ts';

function project(deps: Record<string, string>, files: Record<string, string> = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'zeste-cli-'));
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: deps }));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(cwd, path, '..'), { recursive: true });
    writeFileSync(join(cwd, path), content);
  }
  return cwd;
}

const ZESTE = { '@zeste/svelte': '*', '@zeste/services': '*' };

describe('UI library detection', () => {
  it('shadcn-svelte (components.json) takes precedence over Ark UI and Bits UI', () => {
    expect(detectUi(project({ 'bits-ui': '*' }, { 'components.json': '{}' }))).toBe('shadcn');
    expect(detectUi(project({ '@ark-ui/svelte': '*' }))).toBe('ark');
    expect(detectUi(project({ 'bits-ui': '*' }))).toBe('bits');
    expect(detectUi(project({}))).toBeUndefined();
  });
});

describe('zeste add', () => {
  it('copies the library variant, with no missing dependency', () => {
    const cwd = project({ ...ZESTE, '@ark-ui/svelte': '*' });
    const result = add({ cwd });
    expect(result.ui).toBe('ark');
    expect(result.warnings).toEqual([]);
    expect(result.style).toBe('zeste');
    expect(result.written).toHaveLength(5); // 3 components, index.ts, theme.css
    const prefs = readFileSync(join(cwd, 'src/lib/components/zeste/CookiePreferences.svelte'), 'utf8');
    expect(prefs).toContain("from '@ark-ui/svelte'");
    expect(readFileSync(join(cwd, 'src/lib/components/zeste/theme.css'), 'utf8')).toContain('--zeste-accent');
  });

  it('--style pelure: different visual treatment, same files', () => {
    const cwd = project({ ...ZESTE, 'bits-ui': '*' });
    const result = add({ cwd, style: 'pelure' });
    expect(result.written).toHaveLength(5);
    const banner = readFileSync(join(cwd, 'src/lib/components/zeste/CookieBanner.svelte'), 'utf8');
    expect(banner).toContain('"pelure" style');
    expect(readFileSync(join(cwd, 'src/lib/components/zeste/CookiePreferences.svelte'), 'utf8')).toContain("from 'bits-ui'");
  });

  it('shadcn: uses the components.json alias and reports missing components', () => {
    const cwd = project(ZESTE, {
      'components.json': JSON.stringify({ aliases: { ui: '#lib/components/ui' } }),
      'src/lib/components/ui/button/index.ts': '',
    });
    const result = add({ cwd });
    expect(result.warnings).toEqual(['Missing shadcn components: npx shadcn-svelte@latest add dialog switch label']);
    const banner = readFileSync(join(cwd, 'src/lib/components/zeste/CookieBanner.svelte'), 'utf8');
    expect(banner).toContain("from '#lib/components/ui/button/index.js'");
    expect(banner).not.toContain('%UI%');
    expect(result.written).toHaveLength(4); // no theme.css: shadcn follows the project theme
  });

  it('does not replace your files, except with --force', () => {
    const cwd = project({ ...ZESTE, 'bits-ui': '*' });
    add({ cwd });
    const target = join(cwd, 'src/lib/components/zeste/CookieBanner.svelte');
    writeFileSync(target, 'my version');
    expect(add({ cwd }).skipped).toContain('src/lib/components/zeste/CookieBanner.svelte');
    expect(readFileSync(target, 'utf8')).toBe('my version');
    add({ cwd, force: true });
    expect(readFileSync(target, 'utf8')).not.toBe('my version');
  });

  it('reports missing dependencies', () => {
    expect(add({ cwd: project({}), ui: 'bits' }).warnings).toEqual([
      'Missing dependencies: install @zeste/svelte @zeste/services bits-ui',
    ]);
  });

  it('fails clearly if the library cannot be guessed', () => {
    expect(() => add({ cwd: project({}) })).toThrow(/--ui bits\|ark\|shadcn/);
  });
});
