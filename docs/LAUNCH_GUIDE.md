# GitHub publication guide

## Current publication

- **Repository:** <https://github.com/AndreaUrbani/media-multiviewer>
- **Production:** <https://media-multiviewer.andreaurbani.workers.dev/>
- **Production branch:** `main`
- **Deployment:** `.github/workflows/deploy.yml` builds and deploys every push
  to `main` with the official Cloudflare Wrangler action.

Operational instructions and Free-plan guardrails are maintained in
[HOSTING_AND_OPERATIONS.md](HOSTING_AND_OPERATIONS.md).

## Suggested repository metadata

- **Name:** `media-multiviewer`
- **Description:** `Minimal local-first multiviewer for up to four browser media sources.`
- **Topics:** `media`, `multiview`, `browser-tabs`, `screen-capture`,
  `local-first`, `ocr`, `webrtc`, `react`, `typescript`
- **License:** MIT for original source code
- **Default branch:** `main`

## Recreating the repository

The repository already exists. The commands below are retained only for a new
fork or a replacement repository:

```bash
git add .
git commit -m "Initial public release"
git remote add origin git@github.com:AndreaUrbani/media-multiviewer.git
git push -u origin main
```

Alternatively, with the GitHub CLI already authenticated:

```bash
gh repo create media-multiviewer --public --source=. --remote=origin
git push -u origin main
```

Do not replace the current `origin` accidentally.

## GitHub settings

1. Enable Dependabot alerts and security updates; update pull requests are
   already configured in `.github/dependabot.yml`.
2. Enable secret scanning, push protection, and private vulnerability reports.
3. Enable code scanning with GitHub's default setup.
4. Protect `main`; require a pull request and the `Node.js 22` check.
5. Disable unused repository features if they are not going to be maintained.
6. Add a social preview captured from the synthetic demo, never from private
   or third-party media.

## First release notes

Mention the four-source limit, browser picker workflow, local-only media path,
audio-browser dependency, protected-media limitation, and responsible-use
boundary. Mention that OCR naming is optional and best-effort. Explicitly state
that provider-controlled, DRM/EME/Widevine/HDCP-protected, URL-imported, or
iframe-blocked sources are unsupported. YouTube and similar providers must not
be presented as guaranteed-compatible integrations.
