# Media Multiviewer

![CI](https://github.com/AndreaUrbani/media-multiviewer/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/AndreaUrbani/media-multiviewer/actions/workflows/deploy.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/license-MIT-e5e5e7.svg)

A minimal, local-first workspace that places up to four browser tabs or windows
in one multiview. Pick one source for audio, focus any tile, or send it to the
browser's native fullscreen mode.

**Live app:** <https://media-multiviewer.andreaurbani.workers.dev/>

> **Project status:** experimental public beta. It does not fetch, proxy,
> record, or host media.

> **Responsible use:** only capture content you are authorized to view and
> display. The project does not bypass DRM, paywalls, access controls, or
> browser security restrictions.

## Highlights

- no stream URL, API key, account, or configuration file is required;
- every source is selected through the browser's own secure sharing panel;
- one click selects the audio source;
- compact presets cover two-source, three-source, 2×2, and four-source hero views;
- drag handles let you reorder sources without reconnecting them;
- browser-provided labels and optional local-frame OCR can suggest source names;
- double click enlarges a tile inside the dashboard;
- the **Fullscreen** action uses native browser fullscreen;
- source names are remembered locally between sessions;
- the built-in demo lets you explore the interface without opening a stream.

Modern browsers intentionally do not let a website list or import all open
tabs automatically. Each tab must be approved by the user. That permission
dialog is the shortest no-code workflow a regular website can provide without
installing a browser extension.

## Provider compatibility

Media Multiviewer is a browser-capture workspace, not a URL player, embedder,
downloader, restreamer, or media proxy. It can display a source only when the
browser returns a usable video track through `getDisplayMedia`.

| Source type | Expected result |
| --- | --- |
| Unprotected HTML5 video, local files, presentations, and ordinary browser tabs | Usually works when the browser offers the tab or window in its sharing panel |
| A source whose provider disables or interferes with screen capture | Unsupported; it may be missing from the picker, pause, or produce a blank frame |
| DRM/EME/Widevine/HDCP-protected playback, rentals, subscription video, and protected broadcasts | Unsupported; black video, silent audio, reduced quality, or capture rejection are expected outcomes |
| A tab whose audio is not offered by the browser or operating system | Video-only; Media Multiviewer cannot recover the missing audio track |
| A pasted stream URL, iframe, playlist URL, or direct media manifest | Unsupported; the application deliberately has no URL-import or proxy feature |

YouTube and similar providers are **not guaranteed or officially supported**.
Some ordinary, non-protected videos may be capturable in particular
browser/OS combinations, while other videos, account tiers, rentals, live
events, or provider policies may block video or audio. Netflix, Disney+,
Prime Video, Hulu, paid sports/broadcast services, and other protected
platforms should be treated as unsupported.

The project does not attempt to bypass any of these restrictions. Provider
names are examples only, not an endorsement or compatibility claim. See
[docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for the complete matrix.

## Start on macOS

The simplest route is to double-click:

```text
Start Media Multiviewer.command
```

On the first run it installs the dependencies. It then starts the local server
and opens `http://localhost:3000` in Google Chrome when available.

## Start from a terminal

Requirements:

- Node.js 22.13 or newer;
- npm 11;
- Chrome or Edge recommended for tab audio capture.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` on the same computer.

## Add media sources

1. Open each media source in a separate browser tab.
2. Press **Add 01** in the dashboard.
3. Choose **Chrome Tab** in the browser panel.
4. Enable **Share tab audio** if needed.
5. Repeat for the remaining slots.

Click a populated tile to make it the active audio source. Use **Replace** to
change one source without clearing the others. Drag the six-dot handle to
reorder sources; the arrow keys work when that handle is focused.

The browser asks for permission again after a refresh or restart. This is a
security requirement and cannot be silently disabled by the application.

## Layouts

| Layout | Sources | Behavior |
| --- | ---: | --- |
| **2-up** | 2 | Two equal sources side by side |
| **3-up** | 3 | One large source with two smaller sources |
| **2×2** | 4 | Four equal sources |
| **Hero** | 4 | Selected source large with three smaller sources |

The selected layout and source order are stored only in the current browser.

## Keyboard controls

| Key | Action |
| --- | --- |
| `1`–`4` | Select the active source |
| `Shift` + `1`–`4` | Open that source in single view |
| `G` or `Esc` | Return to the four-source grid |
| `F` | Fullscreen the active source |

## Privacy and architecture

```text
user-approved browser tab/window
              │
              ▼
      getDisplayMedia stream
              │
              ▼
   local React video element
```

The selected `MediaStream` stays in browser memory. Media Multiviewer has no
upload endpoint, recorder, media proxy, analytics SDK, or database. Refreshing
the page ends the session.

The optional **Auto name** action reads one displayed frame in the browser. The
frame is not uploaded. On first use, Tesseract.js downloads and caches its
English OCR model; later scans reuse that local cache.

See [docs/PRIVACY.md](docs/PRIVACY.md) for the complete local data flow and
browser-storage details.

## Known limitations

- Providers can block, obscure, pause, mute, or reduce the quality of captured
  playback; there is no application-side workaround.
- DRM/EME/Widevine/HDCP-protected players may appear black or refuse capture.
- YouTube and other provider-hosted media are unsupported and may work only
  incidentally for particular unprotected videos and browser combinations.
- Tab audio availability depends on browser and operating system support.
- Mobile browsers generally provide a reduced screen-sharing experience.
- A web page cannot enumerate tabs or pre-approve capture permissions.
- Four simultaneous videos can use significant CPU, GPU, and bandwidth.

See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) for details.

## Development checks

Run the same checks used by CI:

```bash
npm run check
```

Before the first public push:

```bash
npm run release:check
npm run release:check -- --audit
```

The release check validates formatting, candidate file size, common secret
patterns, generated/private artifacts, lint, TypeScript, tests, and the
production build.

## Repository layout

```text
app/       interface and multiview behavior
build/     Sites/vinext build integration
docs/      limitations and GitHub publication guides
scripts/   setup and public-release checks
tests/     production-render assertions
worker/    Cloudflare/vinext runtime entry point
```

## Public release

The public repository deploys `main` automatically to Cloudflare Workers after
building it in GitHub Actions. The repository also includes read-only CI
permissions, Dependabot configuration, release checks, issue templates, a
security policy, and explicit responsible-use boundaries.

See [docs/HOSTING_AND_OPERATIONS.md](docs/HOSTING_AND_OPERATIONS.md) for deploy,
rollback, token rotation, maintenance, and Free-plan guardrails. The original
publication process remains in [docs/PUBLIC_RELEASE_CHECKLIST.md](docs/PUBLIC_RELEASE_CHECKLIST.md)
and [docs/LAUNCH_GUIDE.md](docs/LAUNCH_GUIDE.md).

## License

Original source code is available under the [MIT License](LICENSE). Captured
media, third-party sites, trademarks, and broadcasts are not covered by that
license. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
