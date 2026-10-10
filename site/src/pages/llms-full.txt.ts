import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const origin = (site ? site.origin : 'https://anclavehq.github.io').replace(/\/$/, '');
  const baseUrl = `${origin}${base}`;
  const docsDir = path.resolve('src/content/docs/docs');

  function walk(dir: string): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walk(fullPath));
      } else if (file.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = walk(docsDir).sort();

  let output = `# zeste - Full Documentation\n\n> Comprehensive guide and reference for zeste.\n> Website: ${baseUrl}\n\n---\n\n`;

  for (const filePath of files) {
    const rel = path.relative(docsDir, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    output += `## File: ${rel}\n\n${content}\n\n---\n\n`;
  }

  return new Response(output, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
