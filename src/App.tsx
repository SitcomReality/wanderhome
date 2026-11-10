// App entrypoint: owns which Game is live and which overlay is open, and composes the screens.
// Game logic lives in src/game, session plumbing in src/app, UI in src/components.
import { useCallback, useRef, useState } from 'react';
import { Game } from './game/engine';
import { WELCOME_LINES } from './content/index';
import { meta, doRetire, applyInheritance, applyNewRunPerks, foldRunIntoLifetime } from './game/family/index';
import type { OfflineReport as Report } from './game/sim/offline';
import { bootGame, randomSeed } from './app/bootGame';
import { useGameLoop } from './app/useGameLoop';
import { useSessionKeeper } from './app/useSessionKeeper';
import { useHotkeys } from './app/useHotkeys';
import { HUD, ModalKind } from './components/hud/HUD';
import { Workshop } from './components/workshop/Workshop';
import { TownPanel } from './components/town/TownPanel';
import { Stores } from './components/town/Stores';
import { Settings } from './components/settings/Settings';
import { FamilyPanel } from './components/family/FamilyPanel';
import { InheritancePick } from './components/family/InheritancePick';
import { Memories } from './components/family/Memories';
import { VisitorCard } from './components/family/VisitorCard';
import { Toasts } from './components/family/Toasts';
import { TitleScreen } from './components/screens/TitleScreen';
import { OfflineReport } from './components/screens/OfflineReport';

export default function App() {
  const [boot] = useState(bootGame);
  const [game, setGame] = useState<Game>(boot.game);
  const [title, setTitle] = useState(true);
  const [seed, setSeed] = useState(() => (boot.hadSave ? randomSeed() : boot.game.seedStr));
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [offline, setOffline] = useState<Report | null>(null);
  const [welcome] = useState(() => WELCOME_LINES[(Math.random() * WELCOME_LINES.length) | 0]);
  const [uiHidden, setUiHidden] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  // A debug handle for browser probes, only when explicitly requested with ?debug=1.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
    Object.defineProperty(globalThis, '__wanderhaus', { configurable: true, get: () => gameRef.current });
  }
  const modalRef = useRef<ModalKind | null>(null);
  modalRef.current = modal;
  const playingRef = useRef(!title);
  playingRef.current = !title;

  useGameLoop(canvasRef, gameRef);
  const tick = useSessionKeeper(gameRef, playingRef, useCallback((r: Report) => setOffline(r), []));
  const openModal = useCallback((m: ModalKind) => {
    setUiHidden(false);
    // Browsing a town's wares shouldn't mean drifting out of it while you read.
    if (m === 'trade' && gameRef.current.docked) gameRef.current.parkAtDock();
    setModal(m);
  }, []);
  const toggleModal = useCallback((m: ModalKind | null) => {
    setUiHidden(false);
    const cur = modalRef.current;
    if (m === null || cur === m) { setModal(null); return; }
    openModal(m);
  }, [openModal]);
  const toggleUi = useCallback(() => { setUiHidden((h) => !h); setModal(null); }, []);
  useHotkeys(gameRef, playingRef, toggleModal, toggleUi);

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!playingRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    gameRef.current.click(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
  }, []);
  const onCanvasContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!playingRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    gameRef.current.rightClick(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
  }, []);
  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => { if (playingRef.current) gameRef.current.zoomBy(e.deltaY > 0 ? -1 : 1); }, []);

  const swapGame = (g: Game) => { setGame(g); gameRef.current = g; };
  /** Leave the current house without retiring: its stats still count for lifetime milestones. */
  const abandon = () => { foldRunIntoLifetime(game); Game.wipe(); };

  const start = (cont: boolean) => {
    let g = game;
    if (!cont) { abandon(); g = new Game(seed.trim() || randomSeed()); swapGame(g); }
    else if (g.offlineReport && !g.offlineSeen) setOffline(g.offlineReport);
    g.beginPlay();
    g.lastInput = g.time;
    setTitle(false);
    g.save();
  };
  const newGame = () => {
    abandon();
    swapGame(new Game(randomSeed()));
    setModal(null);
    setSeed(randomSeed());
    setTitle(true);
  };
  const retire = () => {
    if (!doRetire(game)) return; // not ready, or already retired (double-click)
    Game.wipe();
    const g = new Game(randomSeed()); // perks + inheritance are applied on the inheritance screen
    g.beginPlay();
    g.lastInput = g.time;
    swapGame(g);
    setModal(null);
    setOffline(null);
    g.save();
  };
  const pickInheritance = (id: string) => {
    if (!meta.pendingInheritance) return;
    applyNewRunPerks(game);
    applyInheritance(game, id);
    game.save();
  };
  const closeOffline = () => { game.offlineSeen = true; setOffline(null); };
  const close = () => setModal(null);
  const playing = !title;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1b2433] font-sans">
      <canvas ref={canvasRef} onClick={onCanvasClick} onContextMenu={onCanvasContextMenu} onWheel={onWheel} className="absolute inset-0 h-full w-full touch-manipulation" style={{ imageRendering: 'pixelated' }} />

      {playing && !uiHidden && <HUD game={game} tick={tick} open={openModal} onHide={toggleUi} />}
      {playing && !uiHidden && <VisitorCard game={game} tick={tick} />}
      {playing && <Toasts game={game} tick={tick} />}
      {playing && uiHidden && (
        <>
          <div className="ui-hint pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-1.5 text-xs text-stone-200 backdrop-blur">
            Press <b className="text-amber-200">H</b> to show the interface
          </div>
          <button onClick={() => setUiHidden(false)} title="Show UI (H)" className="absolute right-2 top-2 rounded-full bg-black/25 px-2 py-1 text-xs text-white/40 transition hover:bg-black/60 hover:text-white">👁️</button>
        </>
      )}
      {playing && modal === 'stores' && <Stores game={game} tick={tick} onClose={close} />}
      {playing && modal === 'garage' && <Workshop game={game} tick={tick} onClose={close} />}
      {playing && modal === 'trade' && <TownPanel game={game} tick={tick} onClose={close} />}
      {playing && modal === 'settings' && <Settings game={game} onClose={close} onNewGame={newGame} />}
      {playing && modal === 'memories' && <Memories game={game} tick={tick} onClose={close} />}
      {playing && modal === 'legacy' && <FamilyPanel game={game} tick={tick} onClose={close} onRetire={retire} />}
      {playing && meta.pendingInheritance && <InheritancePick game={game} ids={meta.pendingInheritance} onPick={pickInheritance} />}
      {playing && offline && !meta.pendingInheritance && <OfflineReport game={game} report={offline} welcome={welcome} onClose={closeOffline} />}

      {title && (
        <TitleScreen game={game} hasSave={boot.hadSave} recovered={boot.recovered} seed={seed} setSeed={setSeed} onContinue={() => start(true)} onNew={() => start(false)} />
      )}
    </div>
  );
}
