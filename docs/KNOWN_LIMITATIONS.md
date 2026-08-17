# Known limitations

## Compatibility contract

Media Multiviewer does not load a provider URL into an iframe and does not
request the provider's video, playlist, manifest, or API. It only renders a
`MediaStream` returned by the browser after the user selects a tab or window.

A source is compatible only when all of the following remain true:

1. the browser exposes the source in its secure sharing panel;
2. the browser returns a readable video track;
3. the provider and content-protection stack allow visible capture;
4. the browser/OS offers an audio track if audio is required;
5. playback continues normally while the source tab is captured.

The dashboard cannot override a failure at any of these layers.

## Browser permission boundary

A regular website cannot list open tabs, identify their URLs, or start sharing
them without a fresh user choice. Media Multiviewer therefore opens the
browser's secure picker once for each source. Refreshing the page ends all
captures and requires new approval.

This behavior is intentional browser security, not an unfinished feature.

## Protected media

DRM, Encrypted Media Extensions (EME), Widevine, FairPlay, PlayReady, HDCP, and
provider-specific capture prevention can cause black video, silent audio,
reduced resolution, paused playback, or a rejected capture request. This
project does not detect, change, or bypass that behavior.

Rentals, subscription video, premium live events, protected sports/broadcast
services, and other licensed playback should be assumed incompatible unless a
specific browser/provider combination proves otherwise.

## Provider examples

YouTube and similar provider-hosted players are unsupported and not covered by
a compatibility promise. An ordinary non-protected video may happen to work in
one version of Chrome or Edge, while another video, account tier, rental, live
event, browser version, or operating system can return a blank or silent
stream. A provider can change this behavior without notice.

Netflix, Disney+, Prime Video, Hulu, paid sports/broadcast services, and other
DRM-oriented platforms should be expected not to work. These names are only
examples of provider-controlled behavior; Media Multiviewer has no integration
or affiliation with them.

## Unsupported source-import methods

The application does not accept pasted player URLs, `.m3u8` manifests, direct
video URLs, iframe snippets, cookies, login tokens, or provider API keys. Sites
that block framing through CSP or `X-Frame-Options` cannot be made embeddable by
this project. The intended workflow is always to open an authorized source in
its original tab and then select that tab in the browser picker.

Logins, cookies, paywalls, consent prompts, advertisements, subtitles, player
controls, and overlays remain part of the original source tab. The dashboard
cannot log in, dismiss overlays, change provider quality, or control playback
in that tab.

## Audio

Chrome and Edge provide the most predictable tab-audio experience. The user
must select a browser tab and enable the audio-sharing option in the picker.
Window or full-screen capture may omit audio depending on browser and operating
system. The dashboard labels video-only sources explicitly.

Some providers protect the audio path independently from video. A visible
picture therefore does not imply that audio capture will be available. The
application cannot synthesize, extract, or route audio that the browser did
not include in the returned stream.

## Browser and organization policy

`getDisplayMedia` is not uniformly available across every browser. Enterprise
browser policy, operating-system privacy settings, managed devices, remote
desktop software, hardware acceleration, and graphics-driver behavior can
disable or degrade capture. Chrome and Edge on desktop are the primary target;
other environments are best effort.

Background-tab throttling, battery-saving modes, sleeping displays, minimized
windows, and source-tab suspension can reduce frame rate or pause a capture.
Keeping the source tabs open and actively playing is required.

## Automatic source names

Browsers do not guarantee that a captured tab or window exposes a useful title.
When the browser label is generic, **Auto name** reads one current frame with
English OCR and proposes an editable label. Results depend on visible text,
resolution, contrast, and the current frame; they can be incomplete or wrong.
The first OCR run downloads a language model and stores it in browser cache.

## Performance

Four simultaneous sources continue playing in their original tabs and are
drawn again in the dashboard. CPU, GPU, memory, bandwidth, display resolution,
and source bitrate all affect performance. Lowering playback quality in the
source tabs can reduce resource use.

## Fullscreen

Fullscreen must follow a direct user action. Browser or operating-system policy
may reject it, and the browser always retains the ability to exit fullscreen.

Native fullscreen enlarges one dashboard tile; it does not remove provider
watermarks, controls, letterboxing, resolution limits, or capture protection.

## Mobile devices

The interface is responsive, but multi-source screen sharing is primarily a
desktop-browser workflow. Mobile browsers may offer only whole-screen capture
or no compatible capture surface.

## No remote or server-side session

Cloudflare serves the application shell only. Captured media is not sent to
Cloudflare or synchronized between devices. Opening the dashboard on another
computer will not show the captures from the first computer, and refreshing
the page requires selecting every source again.

## Standards references

- [MDN: `getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
- [W3C Screen Capture specification](https://www.w3.org/TR/screen-capture/)
