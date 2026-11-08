// The requestAnimationFrame loop: resize the canvas, tick the current game, render it.
import { RefObject, useEffect } from 'react';
import type { Game } from '../game/engine';

export function useGameLoop(canvasRef: RefObject<HTMLCanvasElement | null>, gameRef: RefObject<Game>) {
  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0, last = performance.now();
    const dpr = () => Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = Math.floor(cv.clientWidth * dpr()); cv.height = Math.floor(cv.clientHeight * dpr()); };
    resize();
    window.addEventListener('resize', resize);
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      const g = gameRef.current;
      g.dpr = dpr();
      g.update(dt);
      g.render(ctx, cv.width, cv.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [canvasRef, gameRef]);
}
