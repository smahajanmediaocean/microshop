# 🎓 Day 14 — CI/CD Pipeline, Production Build & Deployment
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Production build internals and environment setup | ~2 hrs |
| Session 2 | GitHub Actions CI pipeline | ~2 hrs |
| Session 3 | Docker, Nginx, and deployment strategies | ~2 hrs |
| Hands-On | Containerize and pipeline-enable MicroShop | ~2 hrs |

---

## 🔷 What We're Building Today

Today we move from development confidence to production readiness. We will build MicroShop for production, validate it in CI, and prepare deployment artifacts for Docker and static hosting.

```text
Push commit
  ↓
GitHub Actions
  ├── npm ci
  ├── lint
  ├── test
  ├── build --configuration=production
  └── publish artifacts

Deploy
  ↓
Docker/Nginx or static host [Netlify/Vercel/S3+CloudFront]
        
```

---

## 🔷 SESSION 1 — Angular Production Build

---

### 1️⃣ What `--configuration=production` does

**The real-world mental model:**
> A production build is the professional retail fit-out: packaging is tightened, waste is removed, and only the polished storefront ships.

**Why it matters in MicroShop:** MicroShop should never deploy the same loose debug bundle used in development.

Angular production builds enable optimizations like AOT compilation, minification, and tree shaking.
These reduce bundle size and improve runtime performance.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng build --configuration=production

export const productionBuildEffects = [
  'AOT compilation',
  'Minification',
  'Tree shaking',
  'Dead code elimination'
];
                        
```

| Optimization | Benefit |
|---|---|
| AOT | Templates compiled ahead of time |
| Minification | Smaller JS |
| Tree shaking | Unused code removed |
| Build optimizer | Cleaner runtime output |

**MicroShop decision notes:**
- Always test a production build before release, not only dev server behavior.
- Some bugs only appear after minification or stricter production conditions.
- This is the baseline build artifact all deployment targets depend on.

---

### 2️⃣ Environment files and file replacements

**The real-world mental model:**
> Different branches of the store use different signage and supplier contacts depending on environment.

**Why it matters in MicroShop:** MicroShop dev, staging, and prod usually talk to different APIs and feature flags.

Angular environments let you swap configuration files per build target.
Keep secrets out of source; use environment variables or deployment config where appropriate.
                        

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://dev-api.microshop.local',
  enableWishlist: true
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.microshop.com',
  enableWishlist: true
};
                        
```

| Config kind | Where to put it |
|---|---|
| Non-secret build-time flags | Environment files |
| Secrets | CI/CD secret store or runtime env |
| API URLs | Environment config / deployment variables |

**MicroShop decision notes:**
- Do not commit secrets into Angular environment files.
- Feature flags are a good use of environment configuration.
- Keep environment shapes strongly typed when possible.

---

### 3️⃣ Bundle analysis in production workflow

**The real-world mental model:**
> Before shipping, weigh the boxes and inspect which aisle stocked the heaviest goods.

**Why it matters in MicroShop:** MicroShop should catch accidental production bundle regressions early.

Make bundle analysis part of release investigations, especially after adding major UI or analytics libraries.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng build --configuration=production --stats-json
PS C:\\workspace\\Angular-app\\microshop> npx webpack-bundle-analyzer .\\dist\\microshop\\stats.json
                        
```

| Question | Tool |
|---|---|
| Which chunk grew? | Stats JSON + analyzer |
| Is lazy loading working? | Inspect feature chunks in dist |
| Are source maps exposed? | Build config review |

**MicroShop decision notes:**
- Performance budgeting is easier when bundle growth is visible.
- Use the same analysis workflow repeatedly so comparisons stay fair.
- Pair bundle checks with lazy route verification.

---

### 4️⃣ Production release checklist

**The real-world mental model:**
> A release checklist is the final store-opening walk before customers enter.

**Why it matters in MicroShop:** MicroShop releases should be repeatable and boring.

Formalize a small checklist that covers build, routing, env config, and user-facing basics.
That reduces last-minute mistakes.
                        

```typescript
export const productionChecklist = [
  'Production build succeeds',
  'Environment API URL verified',
  'Lazy routes still split correctly',
  'Source maps policy confirmed',
  'Critical pages smoke tested',
  'Accessibility and SEO spot checks done'
];
                        
```

| Area | Check |
|---|---|
| Build | No warnings/errors |
| Routing | SPA fallback works |
| Perf | Bundle size acceptable |
| Config | Correct environment values |

**MicroShop decision notes:**
- Great teams automate as much of this checklist as possible.
- What is not checked tends to drift.
- Release quality is a system, not a mood.

---

## 🔷 SESSION 2 — GitHub Actions CI Pipeline

---

### 1️⃣ Core CI steps for Angular

**The real-world mental model:**
> CI is the overnight operations team that restocks, inspects, and signs off on every incoming shipment automatically.

**Why it matters in MicroShop:** MicroShop should run lint, tests, and production builds on every PR.

The simplest useful pipeline checks install, lint, unit tests, and build.
That already catches many defects before manual review.
                        

```typescript
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --watch=false --browsers=ChromeHeadless --code-coverage
      - run: npm run build -- --configuration=production
                        
```

| Step | Why it exists |
|---|---|
| Checkout | Get repository code |
| Setup Node | Consistent toolchain |
| `npm ci` | Clean deterministic install |
| Lint/Test/Build | Quality gates |

**MicroShop decision notes:**
- `npm ci` is preferred in CI because it is deterministic and fast with lockfiles.
- Keep pipeline feedback direct and readable.
- This baseline can later add Playwright or affected Nx logic.

---

### 2️⃣ Coverage and artifact uploads

**The real-world mental model:**
> A good inspection report archives both the pass/fail status and the evidence.

**Why it matters in MicroShop:** MicroShop teams may want coverage dashboards and build artifacts from each CI run.

You can upload coverage directories, built dist artifacts, and test reports.
That makes CI more than a green/red light.
                        

```typescript
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Upload build output
        uses: actions/upload-artifact@v4
        with:
          name: microshop-dist
          path: dist/
                        
```

| Artifact | Use |
|---|---|
| Coverage folder | Review test gaps |
| Dist build | Debug build outputs or hand off to deploy stage |
| Playwright report | E2E debugging |

**MicroShop decision notes:**
- Artifacts are especially useful when builds happen on remote runners.
- Upload only what the team actually inspects to avoid clutter.
- Coverage trends are more meaningful than single percentages.

---

### 3️⃣ Secrets, branch protection, and PR checks

**The real-world mental model:**
> Production keys belong in a locked office, and every store change should pass inspection before shelves are updated.

**Why it matters in MicroShop:** MicroShop should protect main branches and keep deployment secrets out of source code.

Use GitHub Actions secrets or environment secrets for sensitive values.
Combine CI with branch protection so quality gates are enforced.
                        

```typescript
env:
  API_URL: ${{ secrets.API_URL }}

// Repository settings checklist
// - Require pull request reviews
// - Require CI status checks to pass
// - Restrict direct pushes to main
                        
```

| Control | Benefit |
|---|---|
| Secrets store | Keeps sensitive config out of repo |
| Branch protection | Prevents bypassing CI |
| Required PR checks | Consistent quality bar |

**MicroShop decision notes:**
- Never hardcode production secrets into Angular source files.
- Branch protection turns process into platform-enforced policy.
- Good CI is part tooling, part governance.

---

### 4️⃣ Extending CI for MicroShop quality

**The real-world mental model:**
> Once the basic inspection works, add more specialized audits without slowing the line unnecessarily.

**Why it matters in MicroShop:** MicroShop may add Playwright, bundle analysis, or SSR smoke tests as maturity grows.

Add checks in phases: keep baseline fast, then expand coverage where incidents justify it.
                        

```typescript
export const pipelineExtensions = [
  'Playwright E2E on main or nightly',
  'SSR smoke route checks',
  'Bundle-size threshold checks',
  'Docker image build verification'
];
                        
```

| Possible check | When to add |
|---|---|
| Playwright | Critical flows need end-to-end confidence |
| Bundle budget | App size regressions become common |
| Docker build | Container deployment is the norm |

**MicroShop decision notes:**
- Do not overload the first version of CI.
- Add checks where real risk exists.
- Fast feedback keeps developers supportive of CI instead of resenting it.

---

## 🔷 SESSION 3 — Deployment Strategies

---

### 1️⃣ Multi-stage Docker build

**The real-world mental model:**
> A multi-stage Dockerfile uses a full workshop to build the storefront, then ships only the finished shop interior to production.

**Why it matters in MicroShop:** MicroShop can be built with Node tooling and served from a lean Nginx image.

This keeps runtime images smaller and cleaner.
It is a standard approach for Angular static deployments.
                        

```typescript
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
COPY --from=build /app/dist/microshop/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
                        
```

| Stage | Purpose |
|---|---|
| Build stage | Install deps and create optimized dist |
| Serve stage | Ship static files with Nginx |

**MicroShop decision notes:**
- If using SSR, runtime deployment may need Node instead of pure static Nginx.
- Keep build context lean with a good `.dockerignore`.
- Multi-stage builds are the standard baseline for Angular SPA containers.

---

### 2️⃣ Nginx config for Angular SPA routing

**The real-world mental model:**
> Nginx should send unknown shelf labels back to the main store entrance so Angular router can handle them.

**Why it matters in MicroShop:** Deep-link refreshes like `/products/42` must not 404 in MicroShop static hosting.

Single-page apps need an index fallback for client-side routes.
This is one of the most common deployment mistakes.
                        

```typescript
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
                        
```

| Request | Server behavior |
|---|---|
| `/styles.css` | Serve real file |
| `/products/42` | Fallback to `index.html` |

**MicroShop decision notes:**
- Always test a deep-link refresh after deployment.
- This same routing concept applies on S3/CloudFront or Netlify rewrite rules.
- Routing bugs often appear only after the first real deployment.

---

### 3️⃣ Static hosts and cloud deployment choices

**The real-world mental model:**
> Different landlords offer different storefront contracts: some are pure static malls, others support custom server logic.

**Why it matters in MicroShop:** MicroShop deployment strategy depends on whether it stays SPA-only, uses SSR, or needs edge routing.

Static hosts like Netlify/Vercel/S3 are great for pure browser builds.
SSR may require Node hosting or framework-specific adapters.
                        

```typescript
export const deploymentChoices = {
  netlify: 'Fast static hosting with redirects',
  vercel: 'Great frontend platform, SSR support depends on setup',
  s3CloudFront: 'Scalable static hosting with CDN',
  dockerKubernetes: 'Flexible enterprise hosting'
};
                        
```

| Target | Best for |
|---|---|
| Netlify/Vercel | Quick static frontend deployments |
| S3 + CloudFront | Static global CDN hosting |
| Docker + VM/Kubernetes | Custom runtime control |

**MicroShop decision notes:**
- Choose deployment to match runtime needs, team skills, and cost.
- Static SPA hosting is the simplest if SSR is not required.
- Operational simplicity is a feature too.

---

### 4️⃣ Health checks, HTTPS, and rollout basics

**The real-world mental model:**
> Production readiness means more than copying files; you also need doors, alarms, and safe opening procedures.

**Why it matters in MicroShop:** MicroShop should define minimal operational expectations for reliable releases.

Plan for HTTPS, simple health checks, and safe rollout strategies.
Even frontend apps benefit from disciplined release operations.
                        

```typescript
export const releaseOpsChecklist = [
  'HTTPS enabled',
  'Health endpoint or static smoke path verified',
  'Rollback path documented',
  'Environment variables validated',
  'CDN cache invalidation strategy understood'
];
                        
```

| Operational concern | Why it matters |
|---|---|
| HTTPS | Security and browser trust |
| Health checks | Detect broken deployments quickly |
| Rollback | Recover fast from bad release |

**MicroShop decision notes:**
- Frontend deployment quality includes routing, TLS, caching, and rollback.
- Production reliability is a product feature.
- Keep the first deployment path simple and well-documented.

---

## 🏗️ Day 14 Hands-On

- Run a production build and inspect the `dist` output.
- Review environment files and confirm no secrets live in source.
- Create or refine a GitHub Actions workflow for lint, test, and production build.
- Add artifact upload steps for coverage or dist output.
- Write a multi-stage Dockerfile for the Angular build.
- Add an `nginx.conf` with SPA fallback routing.
- Decide whether MicroShop should deploy as static assets, Docker/Nginx, or SSR Node runtime.
- Write a tiny production checklist covering HTTPS, route refreshes, and rollback readiness.
