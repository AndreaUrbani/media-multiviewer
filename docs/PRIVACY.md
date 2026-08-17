# Privacy

Media Multiviewer is designed around a local-only media path.

## Captured media

Each source is selected through the browser's `getDisplayMedia` permission
panel. Video and optional audio are rendered directly from the resulting
`MediaStream`; the application has no upload endpoint, recorder, analytics SDK,
database, or application account.

Refreshing or closing the page ends the session. The browser asks for capture
permission again the next time the application starts.

## Automatic names

When available, a browser-provided capture label can be used as the initial
source name. The optional **Auto name** action copies one currently displayed
frame into an in-memory canvas and runs Tesseract.js in the browser. The frame
is not uploaded or saved by Media Multiviewer.

On first use, Tesseract.js downloads an English language model from its default
distribution service and caches it in browser storage. This model is program
data, not captured media.

## Stored preferences

The application uses `localStorage` for:

- editable source labels;
- the selected layout;
- the preferred source order.

Captured streams, recognized frames, audio, cookies from source tabs, and
source URLs are not stored there. Clear the site's browser data to remove these
preferences and the OCR cache.

## Hosting metadata

When the application is opened from a public URL, the hosting provider receives
the ordinary request metadata needed to deliver the site's HTML, JavaScript,
styles, and fonts, such as the visitor's IP address and browser information.
Captured media, recognized frames, source URLs, and saved preferences are not
sent with those requests.

## Responsible disclosure

Potential privacy or security issues should be reported privately as described
in [SECURITY.md](../SECURITY.md).
