# Public release checklist

Use this checklist before the first public GitHub push.

## Local verification

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run release:check` passes.
- [ ] `npm run release:check -- --audit` has no production advisory.
- [ ] The macOS double-click launcher starts the dashboard.
- [ ] Demo, tab capture, audio selection, focus, replacement, fullscreen, all
      four layouts, and animated drag ordering have been tested manually in
      current Chrome.
- [ ] **Auto name** has been tested once with a visible title or scoreboard and
      once with no readable text.
- [ ] `git status --ignored` shows dependencies, builds, logs, `.env` files,
      and local runtime output as ignored.
- [ ] No captured media, cookies, private URLs, browser data, or credentials are
      present in the candidate repository.

## GitHub repository

- [ ] Use `main` as the default branch.
- [ ] Add the description and topics from [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md).
- [ ] Enable Dependabot alerts, secret scanning, push protection, and private
      vulnerability reporting.
- [ ] Enable GitHub code scanning with default setup.
- [ ] Protect `main` and require the `Node.js 22` CI job.
- [ ] Review the MIT License and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
- [ ] Use [RELEASE_NOTES_0.1.0.md](RELEASE_NOTES_0.1.0.md) for the first GitHub release.
- [ ] Add an application screenshot as the social preview only after the final
      browser test contains synthetic demo content.

## Release message

State clearly that Media Multiviewer is:

- an independent, local-first utility;
- experimental and browser-dependent;
- unable to bypass DRM or access controls;
- shipped without media, credentials, private URLs, or source integrations;
- intended only for content the user is authorized to display.
