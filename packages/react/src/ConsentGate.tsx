'use client';

/*
 * Shows third-party content only if the service is accepted, otherwise a placeholder.
 *
 * Two uses:
 * - catalog service (YouTube, Vimeo, Maps…): pass `embed`, zeste renders the iframe;
 * - your own content: pass `children`, rendered as is once the service is accepted.
 */
import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import type { ServiceState } from '@zeste/core';
import { useZeste } from './context.ts';

export interface PlaceholderProps {
  service: ServiceState;
  /** Accepts this service only. */
  allow: () => void;
}

export interface ConsentGateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'placeholder'> {
  /** Service key, e.g. `youtube`. */
  service: string;
  /** Embed parameters, e.g. `{ videoID: 'dQw4w9WgXcQ', width: 560 }`. */
  embed?: Record<string, string | number | boolean>;
  /** tarteaucitron embed class, if the service has several (e.g. `fb-post`). */
  embedClass?: string;
  /** Content shown once the service is accepted (instead of the catalog embed). */
  children?: ReactNode;
  /** Shown while the service is not accepted. */
  placeholder?: (props: PlaceholderProps) => ReactNode;
}

export function ConsentGate({
  service,
  embed,
  embedClass,
  children,
  placeholder,
  className,
  ...rest
}: ConsentGateProps) {
  const zeste = useZeste();
  const info = zeste.services.find((s) => s.key === service);
  const granted = zeste.has(service);
  const targetClass = embedClass ?? info?.embedClasses?.[0];
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  // The service fills the element once mounted; already-rendered embeds are left untouched.
  useEffect(() => {
    if (granted && element) zeste.manager.rescan(service);
  }, [zeste, service, granted, element]);

  const hasChildren = children !== undefined && children !== null;
  useEffect(() => {
    if (!info) console.warn(`[zeste] <ConsentGate service="${service}"> : service not declared in createZeste().`);
    else if (!hasChildren && !targetClass) {
      console.warn(`[zeste] <ConsentGate service="${service}"> : this service has no embed, pass content (children).`);
    }
  }, [info, service, hasChildren, targetClass]);

  if (!info) return null;

  const allow = () => zeste.grant(service);

  if (granted) {
    if (hasChildren) return <>{children}</>;
    if (!targetClass) return null;
    // HTML attributes ignore case: lowercase keeps React quiet about `data-videoID`.
    const dataAttributes = Object.fromEntries(
      Object.entries(embed ?? {}).map(([key, value]) => [`data-${key.toLowerCase()}`, String(value)]),
    );
    // No React children: the service owns this element's content.
    return <div ref={setElement} {...rest} {...dataAttributes} className={classes(targetClass, className)} />;
  }

  if (placeholder) return <>{placeholder({ service: info, allow })}</>;

  return (
    <div {...rest} className={classes('zeste-placeholder', className)} data-zeste-service={service}>
      {/* Same text as tarteaucitron: "YouTube is disabled." + "Allow" */}
      <p>
        {info.name} {zeste.messages.fallback}
      </p>
      <button type="button" onClick={allow}>
        {zeste.messages.allow} {info.name}
      </button>
    </div>
  );
}

const classes = (...names: Array<string | undefined>) => names.filter(Boolean).join(' ');
