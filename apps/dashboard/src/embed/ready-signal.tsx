import { useEffect, type PropsWithChildren } from 'react';

interface ReadySignalProps {
  onReady: () => void;
}

/**
 * Tells the host the screen has something to show.
 *
 * It sits inside the boundary that holds the screen back, so it mounts only
 * once the screen has resolved — its code fetched and its data loaded. The
 * host keeps its own placeholder until then, which is how one placeholder
 * covers the whole wait instead of each app drawing its own.
 *
 * @param props.onReady - Called once the screen has content. Called again on
 * a later render, so it must do nothing the second time.
 * @param props.children - The screen.
 */
export function ReadySignal({ onReady, children }: Readonly<PropsWithChildren<ReadySignalProps>>) {
  useEffect(() => onReady(), [onReady]);

  return children;
}
