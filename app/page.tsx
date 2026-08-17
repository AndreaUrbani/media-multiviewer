"use client";

import { type DragEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type TileMode = "empty" | "capture" | "demo";
type LayoutMode = "split" | "triple" | "grid" | "hero";

type MediaTile = {
  id: number;
  title: string;
  mode: TileMode;
  stream: MediaStream | null;
  hasAudio: boolean;
};

type OcrWorker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;

const DEMO_GAMES = [
  { away: "NORTH", home: "SOUTH", awayScore: 17, homeScore: 21, clock: "Q3 · 08:42" },
  { away: "EAST", home: "WEST", awayScore: 10, homeScore: 10, clock: "HALFTIME" },
  { away: "CITY", home: "UNITED", awayScore: 27, homeScore: 24, clock: "Q4 · 01:18" },
  { away: "ALPHA", home: "OMEGA", awayScore: 7, homeScore: 14, clock: "Q2 · 05:06" },
] as const;

const INITIAL_TILES: MediaTile[] = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  title: `Source ${index + 1}`,
  mode: "empty",
  stream: null,
  hasAudio: false,
}));

const SAVED_TITLES_KEY = "media-multiviewer:titles:v1";
const SAVED_LAYOUT_KEY = "media-multiviewer:layout:v1";
const SAVED_ORDER_KEY = "media-multiviewer:order:v1";
const DEFAULT_TILE_ORDER = INITIAL_TILES.map((tile) => tile.id);

const LAYOUT_OPTIONS: ReadonlyArray<{
  id: LayoutMode;
  label: string;
  description: string;
  panes: number;
}> = [
  { id: "split", label: "2-up", description: "Two sources side by side", panes: 2 },
  { id: "triple", label: "3-up", description: "One large source with two smaller sources", panes: 3 },
  { id: "grid", label: "2×2", description: "Four sources in a two by two grid", panes: 4 },
  { id: "hero", label: "Hero", description: "Selected source large with three smaller sources", panes: 4 },
];

const LAYOUT_IDS = LAYOUT_OPTIONS.map((option) => option.id);

const GENERIC_CAPTURE_LABEL = /^(screen|window|browser|tab|chrome tab|edge tab|firefox tab|display|monitor)([\s:_-]*\d+)*$/i;
const OCR_NOISE = /\b(live|stream|watch|fullscreen|volume|settings|sign in|log in|subscribe|advertisement|privacy|cookie|quality|closed captions?)\b/i;

function titleFromTrackLabel(track: MediaStreamTrack | undefined) {
  if (!track?.label) return null;

  const title = track.label
    .replace(/^(?:Google Chrome|Chrome|Microsoft Edge|Edge|Firefox)\s+Tab\s*[-–—:]\s*/i, "")
    .replace(/\s*[-–—]\s*(?:Google Chrome|Microsoft Edge|Mozilla Firefox)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (title.length < 3 || GENERIC_CAPTURE_LABEL.test(title)) return null;
  return title.slice(0, 64);
}

function mediaTitleFromRecognizedText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\p{L}\p{N}@&.'’+\-–—: ]/gu, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && line.length <= 64 && /\p{L}/u.test(line));

  const matchup = lines.find((line) => /\s(?:vs?\.?|versus|@)\s/i.test(line) && !OCR_NOISE.test(line));
  if (matchup) return matchup.replace(/\s+(?:vs?\.?|versus|@)\s+/i, " vs ");

  const scoreTeams = lines
    .map((line) => line.match(/^([\p{L}][\p{L} .'’&-]{1,28})\s+(\d{1,3})$/u))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => match[1].trim())
    .filter((team) => !OCR_NOISE.test(team));
  if (scoreTeams.length >= 2) return `${scoreTeams[0]} vs ${scoreTeams[1]}`.slice(0, 64);

  const ranked = lines
    .filter((line) => !OCR_NOISE.test(line))
    .map((line) => {
      const words = line.split(" ").length;
      const letters = line.match(/\p{L}/gu) ?? [];
      const upper = line.match(/\p{Lu}/gu) ?? [];
      const uppercaseRatio = letters.length ? upper.length / letters.length : 0;
      const score = (words >= 2 && words <= 7 ? 4 : 0)
        + (uppercaseRatio > 0.65 ? 3 : 0)
        + (/\d/.test(line) ? 1 : 0)
        + (line.length >= 6 && line.length <= 42 ? 2 : 0);
      return { line, score };
    })
    .sort((first, second) => second.score - first.score);

  return ranked[0]?.score >= 5 ? ranked[0].line : null;
}

function CaptureVideo({ stream, muted }: { stream: MediaStream; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    void video.play().catch(() => undefined);

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    void video.play().catch(() => undefined);
  }, [muted]);

  // The captured source owns any embedded captions; the dashboard does not
  // receive a separate caption track through getDisplayMedia.
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video ref={videoRef} className="capture-video" autoPlay playsInline muted={muted} />;
}

function DemoFeed({ index }: { index: number }) {
  const game = DEMO_GAMES[index];

  return (
    <div className="demo-canvas">
      <div className="demo-feed" aria-label={`Demo ${game.away} versus ${game.home}`}>
        <div className="demo-stadium" />
        <div className="demo-field">
          <span className="yard yard--1" />
          <span className="yard yard--2" />
          <span className="yard yard--3" />
          <span className="yard yard--4" />
          <span className="yard yard--5" />
          <span className="demo-player demo-player--a" />
          <span className="demo-player demo-player--b" />
          <span className="demo-player demo-player--c" />
          <span className="demo-ball" />
        </div>
        <div className="demo-safe-frame" aria-hidden="true">
          <span className="frame-corner frame-corner--tl">TL</span>
          <span className="frame-corner frame-corner--tr">TR</span>
          <span className="frame-corner frame-corner--bl">BL</span>
          <span className="frame-corner frame-corner--br">BR</span>
        </div>
        <span className="demo-fit-label">16:9 FIT</span>
        <div className="scorebug">
          <div className="scorebug-team"><span>{game.away}</span><strong>{game.awayScore}</strong></div>
          <div className="scorebug-team"><span>{game.home}</span><strong>{game.homeScore}</strong></div>
          <div className="scorebug-clock">{game.clock}</div>
        </div>
        <span className="demo-live"><i /> LIVE DEMO</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [tiles, setTiles] = useState<MediaTile[]>(INITIAL_TILES);
  const [tileOrder, setTileOrder] = useState<number[]>(DEFAULT_TILE_ORDER);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [activeAudioId, setActiveAudioId] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draggedTileId, setDraggedTileId] = useState<number | null>(null);
  const [dragOverTileId, setDragOverTileId] = useState<number | null>(null);
  const [detectingNameId, setDetectingNameId] = useState<number | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const liveStreams = useRef(new Map<number, MediaStream>());
  const tileElements = useRef(new Map<number, HTMLElement>());
  const previousTileRects = useRef(new Map<number, DOMRect>());
  const ocrWorker = useRef<OcrWorker | null>(null);
  const ocrWorkerPromise = useRef<Promise<OcrWorker> | null>(null);

  const orderedTiles = useMemo(
    () => tileOrder
      .map((id) => tiles.find((tile) => tile.id === id))
      .filter((tile): tile is MediaTile => Boolean(tile)),
    [tileOrder, tiles],
  );
  const connectedCount = tiles.filter((tile) => tile.mode !== "empty").length;
  const layoutPaneCount = LAYOUT_OPTIONS.find((option) => option.id === layoutMode)?.panes ?? 4;
  const activeTile = tiles.find((tile) => tile.id === (focusId ?? activeAudioId)) ?? null;
  const nextEmptyTile = orderedTiles.slice(0, layoutPaneCount).find((tile) => tile.mode === "empty") ?? null;

  const clearTile = useCallback((id: number) => {
    const stream = liveStreams.current.get(id);
    liveStreams.current.delete(id);
    stream?.getTracks().forEach((track) => track.stop());
    setTiles((current) => current.map((tile) => (
      tile.id === id ? { ...tile, mode: "empty", stream: null, hasAudio: false } : tile
    )));
    setActiveAudioId((current) => current === id ? null : current);
    setFocusId((current) => current === id ? null : current);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedTitles = JSON.parse(localStorage.getItem(SAVED_TITLES_KEY) ?? "null") as unknown;
        if (Array.isArray(savedTitles) && savedTitles.every((title) => typeof title === "string")) {
          setTiles((current) => current.map((tile, index) => ({
            ...tile,
            title: savedTitles[index]?.trim() || tile.title,
          })));
        }
      } catch {
        localStorage.removeItem(SAVED_TITLES_KEY);
      }

      try {
        const savedOrder = JSON.parse(localStorage.getItem(SAVED_ORDER_KEY) ?? "null") as unknown;
        const isValidOrder = Array.isArray(savedOrder)
          && savedOrder.length === DEFAULT_TILE_ORDER.length
          && savedOrder.every((id) => typeof id === "number" && DEFAULT_TILE_ORDER.includes(id))
          && new Set(savedOrder).size === DEFAULT_TILE_ORDER.length;
        if (isValidOrder) setTileOrder(savedOrder as number[]);
      } catch {
        localStorage.removeItem(SAVED_ORDER_KEY);
      }

      const savedLayout = localStorage.getItem(SAVED_LAYOUT_KEY);
      if (savedLayout && LAYOUT_IDS.includes(savedLayout as LayoutMode)) {
        setLayoutMode(savedLayout as LayoutMode);
      } else if (savedLayout) {
        localStorage.removeItem(SAVED_LAYOUT_KEY);
      }

      setPreferencesLoaded(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    localStorage.setItem(SAVED_TITLES_KEY, JSON.stringify(tiles.map((tile) => tile.title)));
  }, [preferencesLoaded, tiles]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    localStorage.setItem(SAVED_LAYOUT_KEY, layoutMode);
  }, [layoutMode, preferencesLoaded]);

  useLayoutEffect(() => {
    if (previousTileRects.current.size === 0) return;

    tileElements.current.forEach((element, id) => {
      const previous = previousTileRects.current.get(id);
      if (!previous) return;

      const current = element.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      element.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });

    previousTileRects.current.clear();
  }, [tileOrder]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    localStorage.setItem(SAVED_ORDER_KEY, JSON.stringify(tileOrder));
  }, [preferencesLoaded, tileOrder]);

  useEffect(() => {
    const streams = liveStreams.current;
    return () => {
      const activeStreams = Array.from(streams.values());
      streams.clear();
      activeStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    };
  }, []);

  useEffect(() => () => {
    const worker = ocrWorker.current;
    ocrWorker.current = null;
    if (worker) void worker.terminate();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      const digitMatch = event.code.match(/^Digit([1-4])$/);
      const id = digitMatch ? Number(digitMatch[1]) : null;
      const selectedTile = id ? tiles.find((tile) => tile.id === id && tile.mode !== "empty") : null;

      if (selectedTile && id) {
        event.preventDefault();
        setActiveAudioId(id);
        if (event.shiftKey) setFocusId(id);
      }

      if (event.key.toLowerCase() === "f" && activeTile) {
        const element = document.getElementById(`media-tile-${activeTile.id}`);
        void element?.requestFullscreen().catch(() => setNotice("The browser blocked fullscreen mode."));
      }

      if (event.key === "Escape" || event.key.toLowerCase() === "g") setFocusId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTile, tiles]);

  const startCapture = async (id: number) => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setNotice("Tab capture is unavailable. Open the app in Chrome or Edge.");
      return;
    }

    setIsCapturing(id);
    setNotice(null);

    try {
      const options = {
        video: true,
        audio: { suppressLocalAudioPlayback: true },
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        surfaceSwitching: "include",
        systemAudio: "exclude",
      } as unknown as DisplayMediaStreamOptions;

      const stream = await navigator.mediaDevices.getDisplayMedia(options);
      const previous = liveStreams.current.get(id);
      liveStreams.current.set(id, stream);
      previous?.getTracks().forEach((track) => track.stop());

      const hasAudio = stream.getAudioTracks().length > 0;
      const browserSuggestedTitle = titleFromTrackLabel(stream.getVideoTracks()[0]);
      setTiles((current) => current.map((tile) => (
        tile.id === id
          ? {
              ...tile,
              title: browserSuggestedTitle && /^Source \d+$/.test(tile.title) ? browserSuggestedTitle : tile.title,
              mode: "capture",
              stream,
              hasAudio,
            }
          : tile
      )));
      setActiveAudioId(id);

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (liveStreams.current.get(id) !== stream) return;
        liveStreams.current.delete(id);
        setTiles((current) => current.map((tile) => (
          tile.id === id ? { ...tile, mode: "empty", stream: null, hasAudio: false } : tile
        )));
        setActiveAudioId((current) => current === id ? null : current);
        setFocusId((current) => current === id ? null : current);
        setNotice(`Source ${id} was disconnected by the browser.`);
      }, { once: true });

      if (!hasAudio) {
        setNotice("Source added without audio. Next time enable “Share tab audio” in the Chrome picker.");
      } else if (connectedCount < 3) {
        setNotice(`Source ${id} connected. Use the + button to add the next tab.`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setNotice("Selection cancelled. Click “Add source” whenever you are ready.");
      } else {
        setNotice("The source could not be added. Check the browser's screen-sharing permission.");
      }
    } finally {
      setIsCapturing(null);
    }
  };

  const captureNext = () => {
    if (!nextEmptyTile) {
      setNotice("All four slots are full. Use “Replace” on a tile to change its source.");
      return;
    }
    void startCapture(nextEmptyTile.id);
  };

  const loadDemo = () => {
    const activeStreams = Array.from(liveStreams.current.values());
    liveStreams.current.clear();
    activeStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    setTiles((current) => current.map((tile) => ({ ...tile, mode: "demo", stream: null, hasAudio: false })));
    setActiveAudioId(1);
    setFocusId(null);
    setNotice("Demo mode is active. Select a tile or open it in fullscreen.");
  };

  const clearAll = () => {
    const activeStreams = Array.from(liveStreams.current.values());
    liveStreams.current.clear();
    activeStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    setTiles(INITIAL_TILES.map((tile) => ({ ...tile })));
    setActiveAudioId(null);
    setFocusId(null);
    setNotice(null);
  };

  const updateTitle = (id: number, title: string) => {
    setTiles((current) => current.map((tile) => tile.id === id ? { ...tile, title } : tile));
  };

  const selectTile = (tile: MediaTile) => {
    if (tile.mode === "empty") {
      void startCapture(tile.id);
      return;
    }

    setActiveAudioId(tile.id);
    if (focusId !== null) setFocusId(tile.id);

    if (tile.mode === "capture" && !tile.hasAudio) {
      setNotice(`“${tile.title}” is video-only because tab audio was not shared.`);
    }
  };

  const requestTileFullscreen = async (id: number) => {
    const element = document.getElementById(`media-tile-${id}`);
    if (!element) return;
    try {
      await element.requestFullscreen();
    } catch {
      setNotice("The browser blocked fullscreen mode. Try again using the button.");
    }
  };

  const moveTile = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;

    previousTileRects.current = new Map(
      Array.from(tileElements.current, ([id, element]) => [id, element.getBoundingClientRect()]),
    );

    setTileOrder((current) => {
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;

      const next = [...current];
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceId);
      return next;
    });

    const heroId = activeAudioId ?? orderedTiles.find((tile) => tile.mode !== "empty")?.id ?? orderedTiles[0]?.id;
    if (layoutMode === "hero" && targetId === heroId) setActiveAudioId(sourceId);
  };

  const beginTileDrag = (event: DragEvent<HTMLButtonElement>, id: number) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
    setDraggedTileId(id);
    setDragOverTileId(null);
  };

  const finishTileDrag = () => {
    setDraggedTileId(null);
    setDragOverTileId(null);
  };

  const moveTileWithKeyboard = (id: number, direction: -1 | 1) => {
    const currentIndex = tileOrder.indexOf(id);
    const targetId = tileOrder[currentIndex + direction];
    if (targetId) moveTile(id, targetId);
  };

  const dropTile = (event: DragEvent<HTMLElement>, targetId: number) => {
    event.preventDefault();
    const sourceId = draggedTileId ?? Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(sourceId) && dragOverTileId !== targetId) moveTile(sourceId, targetId);
    finishTileDrag();
  };

  const getOcrWorker = async () => {
    if (ocrWorker.current) return ocrWorker.current;

    if (!ocrWorkerPromise.current) {
      ocrWorkerPromise.current = import("tesseract.js")
        .then(async ({ createWorker, PSM }) => {
          const worker = await createWorker("eng", 1, {
            logger: (message) => {
              if (message.status === "recognizing text") {
                setOcrProgress(Math.max(1, Math.round(message.progress * 100)));
              }
            },
          });
          await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
          ocrWorker.current = worker;
          return worker;
        })
        .catch((error) => {
          ocrWorkerPromise.current = null;
          throw error;
        });
    }

    return ocrWorkerPromise.current;
  };

  const detectMediaName = async (tile: MediaTile) => {
    if (tile.mode !== "capture" || !tile.stream) return;

    const video = document.querySelector<HTMLVideoElement>(`#media-tile-${tile.id} .capture-video`);
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
      setNotice("The source is not ready for name detection yet. Try again in a moment.");
      return;
    }

    setDetectingNameId(tile.id);
    setOcrProgress(0);
    setNotice("Reading this frame locally. The first scan may download and cache the English OCR model.");

    try {
      const scale = Math.min(1, 1280 / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas is unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const worker = await getOcrWorker();
      const result = await worker.recognize(canvas);
      const suggestion = mediaTitleFromRecognizedText(result.data.text)
        ?? titleFromTrackLabel(tile.stream.getVideoTracks()[0]);

      if (!suggestion) {
        setNotice("No reliable name was found in this frame. Try again when a title or scoreboard is visible.");
        return;
      }

      updateTitle(tile.id, suggestion);
      setNotice(`Suggested name: “${suggestion}”. You can edit it in the tile header.`);
    } catch {
      setNotice("Name detection could not finish. Check the connection once, then try another visible frame.");
    } finally {
      setDetectingNameId(null);
      setOcrProgress(0);
    }
  };

  const visibleTiles = useMemo(() => {
    if (focusId) return orderedTiles.filter((tile) => tile.id === focusId);

    if (layoutMode !== "hero") return orderedTiles.slice(0, layoutPaneCount);

    const primaryId = activeAudioId ?? orderedTiles.find((tile) => tile.mode !== "empty")?.id ?? orderedTiles[0]?.id;
    return [...orderedTiles].sort((first, second) => {
      if (first.id === primaryId) return -1;
      if (second.id === primaryId) return 1;
      return 0;
    });
  }, [activeAudioId, focusId, layoutMode, layoutPaneCount, orderedTiles]);

  const chooseLayout = (layout: LayoutMode) => {
    const paneCount = LAYOUT_OPTIONS.find((option) => option.id === layout)?.panes ?? 4;
    const nextVisibleTiles = orderedTiles.slice(0, paneCount);
    setLayoutMode(layout);
    setFocusId(null);
    setActiveAudioId((current) => {
      if (current && nextVisibleTiles.some((tile) => tile.id === current)) return current;
      return nextVisibleTiles.find((tile) => tile.mode !== "empty")?.id ?? null;
    });
  };

  return (
    <main className="app-shell">
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className={`workspace ${focusId ? "workspace--focus" : ""}`}>
        <div className="workspace-toolbar">
          <div className="workspace-identity">
            <span className="mini-brand" aria-hidden="true"><i /><i /><i /><i /></span>
            <strong>Media Multiviewer</strong>
            <span className="session-count">{connectedCount} / 4</span>
          </div>
          <div className="toolbar-center">
            <div className="layout-switcher" aria-label="Choose layout">
              <span className="layout-switcher-label">Layout</span>
              {LAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className="layout-option"
                  onClick={() => chooseLayout(option.id)}
                  aria-label={option.description}
                  aria-pressed={layoutMode === option.id}
                  title={option.description}
                >
                  <span className={`layout-glyph layout-glyph--${option.id}`} aria-hidden="true">
                    {Array.from({ length: option.panes }, (_, index) => <i key={index} />)}
                  </span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="shortcut-hint" aria-label="Keyboard shortcuts">
              <span><kbd>1–4</kbd> audio</span>
              <span><kbd>⇧ 1–4</kbd> focus</span>
              <span><kbd>F</kbd> fullscreen</span>
            </div>
          </div>
          <div className="toolbar-actions">
            {focusId && (
              <button className="grid-action" onClick={() => setFocusId(null)}>
                Grid <kbd>Esc</kbd>
              </button>
            )}
            <button className="add-action" onClick={captureNext} disabled={isCapturing !== null || !nextEmptyTile}>
              <span>+</span>
              {isCapturing ? "Choose…" : nextEmptyTile ? `Add 0${nextEmptyTile.id}` : "Full"}
            </button>
            <button onClick={loadDemo}>Demo</button>
            {connectedCount > 0 && <button className="danger-action" onClick={clearAll}>Clear</button>}
          </div>
        </div>

        <div className={`media-grid media-grid--${layoutMode} ${focusId ? "media-grid--focus" : ""}`} data-layout={layoutMode}>
          {visibleTiles.map((tile) => {
            const isActive = tile.id === activeAudioId;
            const demoIndex = tile.id - 1;

            return (
              <article
                key={tile.id}
                ref={(element) => {
                  if (element) tileElements.current.set(tile.id, element);
                  else tileElements.current.delete(tile.id);
                }}
                id={`media-tile-${tile.id}`}
                className={`media-tile ${tile.mode !== "empty" ? "media-tile--filled" : ""} ${isActive ? "media-tile--active" : ""} ${draggedTileId === tile.id ? "media-tile--dragging" : ""} ${dragOverTileId === tile.id && draggedTileId !== tile.id ? "media-tile--drop-target" : ""}`}
                onDragOver={(event) => {
                  if (draggedTileId === null || draggedTileId === tile.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverTileId(tile.id);
                }}
                onDragEnter={(event) => {
                  if (draggedTileId === null || draggedTileId === tile.id || dragOverTileId === tile.id) return;
                  event.preventDefault();
                  setDragOverTileId(tile.id);
                  moveTile(draggedTileId, tile.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverTileId(null);
                }}
                onDrop={(event) => dropTile(event, tile.id)}
              >
                {tile.mode === "empty" && (
                  <div className="empty-state">
                    <span className="slot-number">0{tile.id}</span>
                    <button className="capture-trigger" onClick={() => void startCapture(tile.id)} disabled={isCapturing !== null}>
                      <span className="capture-icon"><i /></span>
                      <strong>{isCapturing === tile.id ? "Choose the tab…" : "Choose an open tab"}</strong>
                      <small>The browser’s secure picker will open</small>
                    </button>
                  </div>
                )}

                {tile.mode === "capture" && tile.stream && (
                  <CaptureVideo stream={tile.stream} muted={!isActive} />
                )}

                {tile.mode === "demo" && <DemoFeed index={demoIndex} />}

                {tile.mode !== "empty" && (
                  <>
                    <button
                      className="tile-surface-control"
                      onClick={() => selectTile(tile)}
                      onDoubleClick={() => {
                        setActiveAudioId(tile.id);
                        setFocusId((current) => current === tile.id ? null : tile.id);
                      }}
                      aria-label={`Select ${tile.title}; double-click for single view`}
                    />
                    <div className="tile-topline">
                      <button
                        className="drag-handle"
                        draggable
                        onDragStart={(event) => beginTileDrag(event, tile.id)}
                        onDragEnd={finishTileDrag}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                            event.preventDefault();
                            moveTileWithKeyboard(tile.id, -1);
                          }
                          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                            event.preventDefault();
                            moveTileWithKeyboard(tile.id, 1);
                          }
                        }}
                        aria-label={`Move ${tile.title}. Drag or use the arrow keys to reorder.`}
                        title="Drag or use arrow keys to reorder"
                      >
                        <i /><i /><i /><i /><i /><i />
                      </button>
                      <span className="source-index">0{tile.id}</span>
                      <input
                        value={tile.title}
                        onChange={(event) => updateTitle(tile.id, event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Source ${tile.id} name`}
                      />
                      <span className={`audio-status ${isActive ? "audio-status--on" : ""}`}>
                        {tile.mode === "demo"
                          ? isActive ? "SELECTED" : "DEMO"
                          : !tile.hasAudio ? "VIDEO ONLY" : isActive ? "AUDIO ON" : "MUTED"}
                      </span>
                    </div>
                    <div className="tile-actions">
                      <button onClick={(event) => { event.stopPropagation(); setActiveAudioId(tile.id); setFocusId(tile.id); }}>Focus</button>
                      <button onClick={(event) => { event.stopPropagation(); void requestTileFullscreen(tile.id); }}>Fullscreen</button>
                      {tile.mode === "capture" && (
                        <>
                          <button
                            className="name-action"
                            onClick={(event) => { event.stopPropagation(); void detectMediaName(tile); }}
                            disabled={detectingNameId !== null}
                            title="Suggest a name from the visible frame"
                          >
                            {detectingNameId === tile.id ? `Name ${ocrProgress || "…"}${ocrProgress ? "%" : ""}` : "Auto name"}
                          </button>
                          <button onClick={(event) => { event.stopPropagation(); void startCapture(tile.id); }}>Replace</button>
                        </>
                      )}
                      <button className="tile-remove" onClick={(event) => { event.stopPropagation(); clearTile(tile.id); }}>Remove</button>
                    </div>
                    {tile.mode === "capture" && !tile.hasAudio && (
                      <span className="no-audio-warning">Audio not shared</span>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
