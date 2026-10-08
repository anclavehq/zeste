'use client';

// Demo: picks the placeholder of the displayed style. In a real project, import yours directly.
import { useContext } from 'react';
import type { PlaceholderProps } from '@zeste/react';
import { CookiePlaceholder as Zeste } from '@/components/zeste';
import { CookiePlaceholder as Pelure } from '@/components/zeste-pelure';
import { StyleContext } from './Shell.tsx';

export function Placeholder(props: PlaceholderProps) {
  const Component = useContext(StyleContext) === 'pelure' ? Pelure : Zeste;
  return <Component {...props} />;
}
