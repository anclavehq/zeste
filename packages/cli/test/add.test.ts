import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { add, detectFramework, detectUi, type Framework, type Style, type Ui } from '../src/add.ts';

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
const ZESTE_REACT = { '@zeste/react': '*', '@zeste/services': '*', react: '*' };
const ZESTE_NUXT = { '@zeste/vue': '*', '@zeste/services': '*', nuxt: '*', vue: '*' };

describe('detection', () => {
  it('framework: the zeste binding first, then the framework itself', () => {
    expect(detectFramework(project({ '@zeste/react': '*', svelte: '*' }))).toBe('react');
    expect(detectFramework(project({ svelte: '*' }))).toBe('svelte');
    expect(detectFramework(project({ react: '*', 'react-dom': '*' }))).toBe('react');
    expect(detectFramework(project({ nuxt: '*' }))).toBe('vue');
    expect(detectFramework(project({ '@zeste/vue': '*', react: '*' }))).toBe('vue');
    expect(detectFramework(project({}))).toBeUndefined();
  });

  it('Svelte: shadcn-svelte (components.json) takes precedence over Ark UI and Bits UI', () => {
    expect(detectUi(project({ 'bits-ui': '*' }, { 'components.json': '{}' }), 'svelte')).toBe('shadcn');
    expect(detectUi(project({ '@ark-ui/svelte': '*' }), 'svelte')).toBe('ark');
    expect(detectUi(project({ 'bits-ui': '*' }), 'svelte')).toBe('bits');
    expect(detectUi(project({}), 'svelte')).toBeUndefined();
  });

  it('React: shadcn/ui, then Ark UI, then Radix (unified or per-component packages)', () => {
    expect(detectUi(project({ 'radix-ui': '*' }, { 'components.json': '{}' }), 'react')).toBe('shadcn');
    expect(detectUi(project({ '@ark-ui/react': '*' }), 'react')).toBe('ark');
    expect(detectUi(project({ 'radix-ui': '*' }), 'react')).toBe('radix');
    expect(detectUi(project({ '@radix-ui/react-dialog': '*' }), 'react')).toBe('radix');
    expect(detectUi(project({ '@ark-ui/svelte': '*' }), 'react')).toBeUndefined();
  });

  it('Vue: shadcn-vue, then Ark UI, then Reka UI', () => {
    expect(detectUi(project({ 'reka-ui': '*' }, { 'components.json': '{}' }), 'vue')).toBe('shadcn');
    expect(detectUi(project({ '@ark-ui/vue': '*' }), 'vue')).toBe('ark');
    expect(detectUi(project({ 'reka-ui': '*' }), 'vue')).toBe('reka');
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

  it('fails clearly if the framework or the library cannot be guessed', () => {
    expect(() => add({ cwd: project({}) })).toThrow(/--framework svelte\|react\|vue/);
    expect(() => add({ cwd: project({}), ui: 'ark' })).toThrow(/--framework svelte\|react/);
    expect(() => add({ cwd: project(ZESTE) })).toThrow(/--ui bits\|ark\|shadcn/);
    expect(() => add({ cwd: project(ZESTE_REACT) })).toThrow(/--ui radix\|ark\|shadcn/);
    expect(() => add({ cwd: project(ZESTE_REACT), ui: 'bits' })).toThrow(/not available for react/);
  });
});

describe('zeste add (React)', () => {
  it('Radix: components/ without src/, src/components/ with it', () => {
    const root = project({ ...ZESTE_REACT, 'radix-ui': '*' });
    const result = add({ cwd: root });
    expect(result).toMatchObject({ framework: 'react', ui: 'radix', dir: 'components/zeste', warnings: [] });
    expect(result.written).toHaveLength(5);
    const prefs = readFileSync(join(root, 'components/zeste/CookiePreferences.tsx'), 'utf8');
    expect(prefs).toMatch(/^'use client';/);
    expect(prefs).toContain("from 'radix-ui'");

    const withSrc = project({ ...ZESTE_REACT, '@ark-ui/react': '*' }, { 'src/app/page.tsx': '' });
    expect(add({ cwd: withSrc, style: 'pelure' }).dir).toBe('src/components/zeste');
    expect(readFileSync(join(withSrc, 'src/components/zeste/CookieBanner.tsx'), 'utf8')).toContain('"pelure" style');
    expect(readFileSync(join(withSrc, 'src/components/zeste/theme.css'), 'utf8')).toContain("[data-zeste-skin='pelure']");
  });

  it('shadcn/ui: resolves the @/ alias (src/ or root) and reports missing components', () => {
    const cwd = project(ZESTE_REACT, {
      'components.json': JSON.stringify({ aliases: { ui: '@/components/ui' } }),
      'src/components/ui/button.tsx': '',
      'src/components/ui/dialog.tsx': '',
    });
    const result = add({ cwd });
    expect(result.warnings).toEqual(['Missing shadcn components: npx shadcn@latest add switch label']);
    const prefs = readFileSync(join(cwd, 'src/components/zeste/CookiePreferences.tsx'), 'utf8');
    expect(prefs).toContain("from '@/components/ui/dialog'");
    expect(prefs).not.toContain('%UI%');
    expect(result.written).toHaveLength(4);
  });

  it('reports missing dependencies', () => {
    expect(add({ cwd: project({ react: '*' }), ui: 'ark' }).warnings).toEqual([
      'Missing dependencies: install @zeste/react @zeste/services @ark-ui/react',
    ]);
  });
});

describe('zeste add (Vue)', () => {
  it('Nuxt: components go to app/, Reka UI detected', () => {
    const cwd = project({ ...ZESTE_NUXT, 'reka-ui': '*' }, { 'app/app.vue': '' });
    const result = add({ cwd });
    expect(result).toMatchObject({ framework: 'vue', ui: 'reka', dir: 'app/components/zeste', warnings: [] });
    expect(result.written).toHaveLength(5);
    expect(readFileSync(join(cwd, 'app/components/zeste/CookiePreferences.vue'), 'utf8')).toContain("from 'reka-ui'");
  });

  it('shadcn-vue: resolves the @/ alias into app/ and reports missing components', () => {
    const cwd = project(ZESTE_NUXT, {
      'app/app.vue': '',
      'components.json': JSON.stringify({ aliases: { ui: '@/components/ui' } }),
      'app/components/ui/button/index.ts': '',
    });
    const result = add({ cwd });
    expect(result.warnings).toEqual(['Missing shadcn components: npx shadcn-vue@latest add dialog switch label']);
    expect(readFileSync(join(cwd, 'app/components/zeste/CookieBanner.vue'), 'utf8')).toContain("from '@/components/ui/button'");
  });

  it('Vite: components go to src/', () => {
    const cwd = project({ vue: '*', '@ark-ui/vue': '*' }, { 'src/main.ts': '' });
    expect(add({ cwd, style: 'pelure' })).toMatchObject({ ui: 'ark', dir: 'src/components/zeste' });
  });
});

// The example skins are committed as generated: they must not drift from the templates.
describe('example skins match the templates', () => {
  const examples = join(import.meta.dirname, '../../../examples');
  const skins: Array<[app: string, framework: Framework, ui: Ui, base: string]> = [
    ['skin-bits', 'svelte', 'bits', 'src/lib/components'],
    ['skin-ark', 'svelte', 'ark', 'src/lib/components'],
    ['skin-shadcn', 'svelte', 'shadcn', 'src/lib/components'],
    ['skin-react-radix', 'react', 'radix', 'components'],
    ['skin-react-ark', 'react', 'ark', 'components'],
    ['skin-react-shadcn', 'react', 'shadcn', 'components'],
    ['skin-vue-reka', 'vue', 'reka', 'app/components'],
    ['skin-vue-ark', 'vue', 'ark', 'app/components'],
    ['skin-vue-shadcn', 'vue', 'shadcn', 'app/components'],
  ];
  for (const [app, framework, ui, base] of skins) {
    for (const [style, folder] of [['zeste', 'zeste'], ['pelure', 'zeste-pelure']] as Array<[Style, string]>) {
      it(`${app}, ${style}`, () => {
        // shadcn: the alias of the app's components.json ends up in the imports.
        const config = join(examples, app, 'components.json');
        const cwd = project({}, ui === 'shadcn' ? { 'components.json': readFileSync(config, 'utf8') } : {});
        const expected = join(examples, app, base, folder);
        add({ cwd, framework, ui, style, dir: 'out' });
        for (const file of readdirSync(join(cwd, 'out'))) {
          expect(readFileSync(join(expected, file), 'utf8'), `${app}/${folder}/${file}`).toBe(
            readFileSync(join(cwd, 'out', file), 'utf8'),
          );
        }
      });
    }
  }
});
