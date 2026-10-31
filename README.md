# FIRE & Wealth Dashboard

## Canonical Page

`index.html` is the single source of truth for the dashboard. GitHub Pages publishes it from the repository root at <https://deep1130.github.io/networth/>.

`fire-dashboard.html` is a compatibility redirect for old bookmarks and local links. Make dashboard changes in `index.html` only.

## Local Use and Deployment

Open `index.html` directly to run the dashboard locally. Pushing changes to `main` triggers the `pages-build-deployment` GitHub Actions workflow. The live page updates after that workflow succeeds.

## Award Pricing

Each future grant's stock price at grant determines its fixed RSU share count. The stock valuation price is the assumed market price used to value those shares when they vest.
