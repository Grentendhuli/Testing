import { useEffect } from 'react';

// FORCE COMPONENT REBUILD - OAuth buttons
export function ForceRebuild() {
  useEffect(() => {
    console.log('Build:', '2026-03-11-OAUTH-FIX-v1');
  }, []);
  return null;
}