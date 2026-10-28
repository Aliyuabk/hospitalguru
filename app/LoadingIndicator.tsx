import type { ReactNode } from 'react';

export default function LoadingIndicator({ children = 'Loading', className = '' }: { children?: ReactNode; className?: string }) {
  return <span className={`loading-indicator ${className}`} role="status">
    <span className="loading-spinner" aria-hidden="true" />
    <span className="loading-indicator-label">{children}</span>
  </span>;
}
