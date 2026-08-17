import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Media Multiviewer workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("content-security-policy"), "frame-ancestors 'none'");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), display-capture=(self), geolocation=(), microphone=()");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /<title>Media Multiviewer<\/title>/i);
  assert.match(html, /Media Multiviewer/);
  assert.match(html, /Add 01/);
  assert.match(html, /audio/);
  assert.match(html, /focus/);
  assert.match(html, /fullscreen/);
  assert.match(html, /Choose layout/);
  assert.match(html, />2-up</);
  assert.match(html, />3-up</);
  assert.match(html, />2×2</);
  assert.match(html, />Hero</);
  assert.doesNotMatch(html, />Row<|>Column</);
  assert.match(html, /data-layout="grid"/);
  assert.match(html, /id="media-tile-1"/);
  assert.match(html, /id="media-tile-4"/);
  assert.doesNotMatch(html, /source-rail|control-summary|Quick source controls|ACTIVE OUTPUT/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("includes capture, focus, audio, and fullscreen controls", async () => {
  const [page, layout, styles, packageJson, securityHeaders] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  ]);

  assert.match(page, /getDisplayMedia/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /activeAudioId/);
  assert.match(page, /setFocusId/);
  assert.match(page, /event\.shiftKey/);
  assert.match(page, /event\.key\.toLowerCase\(\) === "g"/);
  assert.match(page, /Share tab audio/);
  assert.match(page, /DEMO_GAMES/);
  assert.match(page, /16:9 FIT/);
  assert.match(page, /demo-canvas/);
  assert.match(page, /media-multiviewer:titles:v1/);
  assert.match(page, /media-multiviewer:layout:v1/);
  assert.match(page, /media-multiviewer:order:v1/);
  assert.match(page, /LAYOUT_OPTIONS/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /draggable/);
  assert.match(page, /dataTransfer\.dropEffect/);
  assert.match(page, /useLayoutEffect/);
  assert.match(page, /element\.animate/);
  assert.match(page, /ArrowLeft/);
  assert.match(page, /layoutPaneCount/);
  assert.match(page, /titleFromTrackLabel/);
  assert.match(page, /detectMediaName/);
  assert.match(page, /import\("tesseract\.js"\)/);
  assert.match(page, /Auto name/);
  assert.match(page, /workspace--focus/);
  assert.match(styles, /object-fit: contain/);
  assert.match(styles, /container-type: size/);
  assert.match(styles, /100cqh \* 16 \/ 9/);
  assert.match(styles, /media-grid--hero/);
  assert.match(styles, /media-grid--split/);
  assert.match(styles, /media-grid--triple/);
  assert.match(styles, /filter: none/);
  assert.match(styles, /demo-feed[\s\S]*filter: saturate\(0\)/);
  assert.match(styles, /drop-target-pulse/);
  assert.doesNotMatch(styles, /media-grid--row|media-grid--column/);
  assert.doesNotMatch(styles, /source-rail|control-summary/);
  assert.match(layout, /lang="en"/);
  assert.match(layout, /local-first/);
  assert.match(packageJson, /"name": "media-multiviewer"/);
  assert.match(packageJson, /"tesseract\.js"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(securityHeaders, /X-Content-Type-Options: nosniff/);
  assert.match(securityHeaders, /Content-Security-Policy: frame-ancestors 'none'/);
  assert.match(securityHeaders, /Referrer-Policy: no-referrer/);
  assert.match(securityHeaders, /X-Frame-Options: DENY/);
  assert.match(securityHeaders, /display-capture=\(self\)/);
  assert.match(securityHeaders, /Cache-Control: public, max-age=31536000, immutable/);
});
