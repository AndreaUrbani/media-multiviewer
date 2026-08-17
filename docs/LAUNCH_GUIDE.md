# GitHub launch guide

## Suggested repository metadata

- **Name:** `media-multiviewer`
- **Description:** `Minimal local-first multiviewer for up to four browser media sources.`
- **Topics:** `media`, `multiview`, `browser-tabs`, `screen-capture`,
  `local-first`, `ocr`, `webrtc`, `react`, `typescript`
- **License:** MIT for original source code
- **Default branch:** `main`

## Create the remote later

After the manual browser test and final review, create an empty GitHub
repository. From this project directory:

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

Do not run these commands until `docs/PUBLIC_RELEASE_CHECKLIST.md` is complete.

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
boundary. Mention that OCR naming is optional and best-effort. Avoid implying
compatibility with any specific media provider.
