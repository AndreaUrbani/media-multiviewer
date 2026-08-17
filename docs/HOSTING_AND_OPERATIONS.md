# Hosting and operations

## Current production setup

- Repository: <https://github.com/AndreaUrbani/media-multiviewer>
- Production URL: <https://media-multiviewer.andreaurbani.workers.dev/>
- Cloudflare Worker: `media-multiviewer`
- Production branch: `main`
- Runtime: Cloudflare Workers with static assets and the vinext Worker entry
  point

The media path remains local to each visitor's browser. Cloudflare serves the
HTML, JavaScript, CSS, fonts, and Worker response; it does not receive the
captured video, audio, source URL, OCR frame, or browser-tab contents.

## Automatic deployment

`.github/workflows/deploy.yml` runs on every push to `main`:

1. check out the commit;
2. install the locked npm dependencies with `npm ci`;
3. build with `npm run build`;
4. deploy with the official Cloudflare Wrangler action;
5. attach the production deployment URL to the GitHub Actions summary.

The deployment uses two GitHub repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Never commit either value. The API token should use the **Edit Cloudflare
Workers** permission template, be limited to the production Cloudflare
account, and have no unrelated permissions.

## Routine release flow

1. Make and review a change locally.
2. Commit the change.
3. Push to `main`.
4. Follow the **Deploy** workflow in GitHub Actions.
5. If the workflow fails, the previous Cloudflare deployment remains active.

Use `npm run deploy` only for an intentional manual deployment from a computer
that is already authenticated with `wrangler login`.

## Rollback

Cloudflare keeps Worker deployment versions. If a production release is bad,
open the Worker's **Deployments** page in Cloudflare and roll back to the last
known-good version. A normal follow-up commit to `main` will create a new
production deployment.

Do not delete the Worker as a rollback mechanism; deletion also removes the
public endpoint.

## Token rotation

Rotate the deployment token if it is exposed, copied to an unsafe location, or
no longer needed:

1. create a new account token in Cloudflare using **Edit Cloudflare Workers**;
2. limit it to the same Cloudflare account;
3. replace the GitHub repository secret named `CLOUDFLARE_API_TOKEN`;
4. confirm the next deployment succeeds;
5. revoke the old token in Cloudflare.

The token value is shown only once by Cloudflare. Do not paste it into issues,
commits, logs, screenshots, documentation, or chat messages.

## Free-plan guardrails

As of August 17, 2026, the Cloudflare Workers Free plan includes 100,000 Worker
requests per day, 10 ms of CPU time per request, 128 MB of memory, a 3 MB Worker
size limit, up to 20,000 static asset files per Worker version, and a 25 MiB
limit per individual static asset.

This project stays inexpensive because it has:

- no media proxy or server-side restreaming;
- no database, D1, R2, KV, Durable Object, Queue, or paid binding;
- no scheduled job, background media processing, or server-side OCR;
- no provider API calls or outgoing media subrequests;
- no custom domain requirement;
- no application analytics or user-account service.

Only the application shell is delivered by Cloudflare. The bandwidth consumed
by the original media continues to flow between the provider and the original
browser tab, not through this Worker.

To preserve the Free-plan architecture:

1. do not add a server-side stream URL fetcher or proxy;
2. do not upload captured frames, audio, or recordings;
3. do not add persistent storage without reviewing its separate quota;
4. keep OCR and media composition in the visitor's browser;
5. monitor the Worker request count in Cloudflare Analytics;
6. review any Cloudflare plan-upgrade prompt before accepting it;
7. keep deployment concurrency at one and avoid automated empty commits.

If the Free daily request limit is reached, Cloudflare can return an error until
the quota resets at midnight UTC. Captured sessions that are already running
in an open page remain browser-local, but a new page load may fail to retrieve
the application shell.

## Provider compatibility is not a hosting feature

Deploying the app publicly does not improve media compatibility. Providers can
still block or degrade capture through DRM, EME, Widevine, FairPlay, PlayReady,
HDCP, browser policy, or provider-specific behavior. YouTube and similar
services are unsupported and not guaranteed to work; protected subscription
and broadcast platforms should be expected not to work.

The public Worker does not bypass these restrictions and must never be extended
into a service that fetches, decrypts, proxies, records, or redistributes
provider media.

## Maintenance cadence

- Review Dependabot pull requests individually; do not auto-merge major
  framework, Wrangler, React, or build-tool updates.
- Run `npm run release:check` before tagged releases.
- Review GitHub Actions and Cloudflare deployment history after infrastructure
  changes.
- Revisit browser-capture compatibility after major Chrome or Edge releases.
- Keep the provider limitation language visible in README and release notes.

## Platform references

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
