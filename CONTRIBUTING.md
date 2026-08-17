# Contributing to Media Multiviewer

Thanks for helping improve the project. Changes should preserve the local-first
privacy model and keep the main workflow usable without technical setup.

## Set up

```bash
npm ci
npm run dev
```

Node.js 22.13 or newer and npm 11 are required.

## Before opening a pull request

```bash
npm run check
```

Keep pull requests focused and explain the browser, operating system, and
capture surface used to verify changes.

## Privacy and scope

Do not commit or attach:

- captured video, audio, screenshots from private sessions, or browser dumps;
- cookies, tokens, credentials, private URLs, or `.env` files;
- code intended to bypass DRM, paywalls, authentication, or access controls;
- third-party media unless its redistribution license is documented.

Use the synthetic demo and source-level tests whenever possible.
