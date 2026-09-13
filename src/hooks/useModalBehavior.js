import { useEffect, useRef } from 'react';

// Hány modál van egyszerre nyitva az egész appban. Csak az utolsó bezárása
// oldja fel a háttér görgetés-zárát.
let openModalCount = 0;

/**
 * Egységes modál-viselkedés: ESC-re zárás + háttér görgetés-zár.
 * Minden modálnál a komponens tetején kell hívni, feltétel nélkül.
 */
export function useModalBehavior(isOpen, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    openModalCount += 1;
    document.body.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen]);
}
