// Keyboard shortcuts for menus plus forwarding movement/action keys to the game.
import { RefObject, useEffect } from 'react';
import type { Game } from '../game/engine';
import type { ModalKind } from '../components/hud/HUD';

export function useHotkeys(gameRef: RefObject<Game>, playingRef: RefObject<boolean>, toggleModal: (m: ModalKind | null) => void, toggleUi: () => void) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!playingRef.current) return;
      const k = e.key.toLowerCase();
      const menus: Record<string, ModalKind> = { g: 'garage', b: 'trade', i: 'stores', j: 'memories', l: 'legacy' };
      if (k === 'escape') return toggleModal(null);
      if (k === 'h') return toggleUi();
      if (k === 'p') return gameRef.current.togglePark();
      if (menus[k]) return toggleModal(menus[k]);
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
      if (e.repeat) return;
      gameRef.current.keyDown(k);
    };
    const up = (e: KeyboardEvent) => gameRef.current.keyUp(e.key);
    const blur = () => gameRef.current.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [gameRef, playingRef, toggleModal, toggleUi]);
}
