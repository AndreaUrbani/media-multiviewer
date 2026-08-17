# Known limitations

## Browser permission boundary

A regular website cannot list open tabs, identify their URLs, or start sharing
them without a fresh user choice. Media Multiviewer therefore opens the
browser's secure picker once for each source. Refreshing the page ends all
captures and requires new approval.

This behavior is intentional browser security, not an unfinished feature.

## Audio

Chrome and Edge provide the most predictable tab-audio experience. The user
must select a browser tab and enable the audio-sharing option in the picker.
Window or full-screen capture may omit audio depending on browser and operating
system. The dashboard labels video-only sources explicitly.

## Protected media

DRM-protected playback can appear black, pause, or reject capture. This project
does not attempt to change or bypass that behavior.

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

## Mobile devices

The interface is responsive, but multi-source screen sharing is primarily a
desktop-browser workflow. Mobile browsers may offer only whole-screen capture
or no compatible capture surface.
