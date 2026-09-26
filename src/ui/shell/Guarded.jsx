import { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Render a guarded lazy component (from src/game/modules.js) or `fallback` when
 * it is missing, still loading (optional `loading`), or crashes.
 */
export default function Guarded({ component: C, fallback = null, loading, name, ...props }) {
  if (!C) return fallback;
  return (
    <ErrorBoundary name={name} fallback={fallback}>
      <Suspense fallback={loading === undefined ? fallback : loading}>
        <C {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
