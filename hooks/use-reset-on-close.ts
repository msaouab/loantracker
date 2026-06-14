import { useEffect, useRef } from "react";

/** Runs `reset` once each time `open` transitions to false. */
export function useResetOnClose(open: boolean, reset: () => void) {
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) reset();
    wasOpen.current = open;
  }, [open, reset]);
}
