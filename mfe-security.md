# MFE Banking Security — 4 Critical Topics

> These are the most critical security practices for a large-scale Angular Micro-Frontend banking application.

---

## Table of Contents

1. [Token Isolation](#1-token-isolation)
2. [MFE Origin Validation](#2-mfe-origin-validation)
3. [Strict CSP with Nonces](#3-strict-csp-with-nonces)
4. [API Gateway Enforcement](#4-api-gateway-enforcement)

---

## 1. 🔑 Token Isolation

### What is it?

Each MFE gets its own **scoped token** with limited permissions. If one MFE is compromised, the attacker **cannot use its token to access other MFEs**.

> Think of it like **separate keycards** for each floor of a bank building. A cleaner's keycard only opens the cleaning room — not the vault.

### Key Rules

- ✅ Store tokens in **JS Memory** (private class variable) — wiped on refresh, invisible to other scripts
- ✅ Each MFE gets a **scoped token** with only its required permissions
- ❌ Never store tokens in `localStorage` — any script on the page can read it
- ❌ Never store tokens in `sessionStorage` — still accessible to any script

### Implementation

```typescript
// token-isolation.service.ts
@Injectable({ providedIn: 'root' })
export class TokenIsolationService {

  // Stored in JS Memory only — NOT localStorage, NOT sessionStorage
  private mfeTokens = new Map<string, string>();

  async getTokenForMFE(mfeName: string): Promise<string> {
    const scopedToken = await this.authServer.getToken({
      scope: this.getScopeForMFE(mfeName),
      audience: mfeName
    });

    this.mfeTokens.set(mfeName, scopedToken);
    return scopedToken;
  }

  private getScopeForMFE(mfeName: string): string {
    const scopeMap: Record<string, string> = {
      'payments-mfe': 'payments:read payments:write',
      'accounts-mfe': 'accounts:read',
      'loans-mfe':    'loans:read loans:apply',
    };
    return scopeMap[mfeName] ?? '';
  }

  getToken(mfeName: string): string {
    return this.mfeTokens.get(mfeName) ?? '';
  }

  revokeToken(mfeName: string) {
    this.mfeTokens.delete(mfeName);
  }
}
```

### Token Storage Strategy

| Token | Where Stored | Why |
|-------|-------------|-----|
| **Access Token** (15 min) | JS Memory | Fast, secure, dies on refresh |
| **Refresh Token** (7 days) | HttpOnly Cookie | JS can't steal it, browser auto-sends |
| **Never anything** | localStorage | Anyone can steal it |

### Silent Re-Authentication on Page Refresh

When the page refreshes, JS memory is wiped. The app silently re-authenticates using the HttpOnly cookie:

```typescript
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken = '';  // JS Memory only

  login(credentials: LoginDto) {
    return this.http.post<{ accessToken: string }>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          this.accessToken = response.accessToken;
          // HttpOnly cookie is set automatically by the browser from server response
        })
      );
  }

  silentRefresh() {
    return this.http.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true }  // browser sends the HttpOnly cookie automatically
    ).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
      })
    );
  }
}
```

```typescript
// app.component.ts — runs on every page load including refresh
export class AppComponent implements OnInit {
  ngOnInit() {
    this.authService.silentRefresh().subscribe({
      next: ()  => console.log('Session restored silently'),
      error: () => this.router.navigate(['/login'])
    });
  }
}
```

```typescript
// Backend (Node/Express) — sets HttpOnly cookie on login
app.post('/api/auth/login', (req, res) => {
  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,     // JS cannot read this
    secure: true,       // HTTPS only
    sameSite: 'strict', // blocks CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  });

  res.json({ accessToken });
});
```

---

## 2. 🌍 MFE Origin Validation

### What is it?

Your shell app dynamically loads MFEs from URLs at runtime. Origin validation ensures **only trusted URLs from your domain** are ever loaded.

> Think of it like a **bouncer at a bank event** who checks IDs against a guest list. No ID match = no entry.

### Key Rules

- ✅ Maintain a **hardcoded whitelist** of trusted MFE origins
- ✅ Validate `postMessage` events against allowed origins
- ❌ Never load MFEs from dynamic or user-supplied URLs
- ❌ Never use `event.origin === '*'` in postMessage handlers

### Implementation

```typescript
// mfe-registry.service.ts
@Injectable({ providedIn: 'root' })
export class MfeRegistryService {

  // ONLY these URLs are trusted
  private readonly TRUSTED_MFE_ORIGINS: Record<string, string> = {
    'payments-mfe':  'https://payments.mybank.com/remoteEntry.js',
    'accounts-mfe':  'https://accounts.mybank.com/remoteEntry.js',
    'loans-mfe':     'https://loans.mybank.com/remoteEntry.js',
  };

  getVerifiedRemoteUrl(mfeName: string): string {
    const trustedUrl = this.TRUSTED_MFE_ORIGINS[mfeName];

    if (!trustedUrl) {
      throw new Error(`SECURITY: Unknown MFE "${mfeName}" — BLOCKED`);
    }

    return trustedUrl;
  }
}
```

```typescript
// mfe-loader.service.ts
async loadMFE(mfeName: string) {
  const remoteUrl = this.registry.getVerifiedRemoteUrl(mfeName);

  // Verify the URL belongs to our domain before loading
  const allowedDomain = '.mybank.com';
  if (!new URL(remoteUrl).hostname.endsWith(allowedDomain)) {
    console.error(`BLOCKED: ${remoteUrl} is not a trusted origin`);
    return null;
  }

  return await loadRemoteModule({
    type: 'module',
    remoteEntry: remoteUrl,
    exposedModule: './Module'
  });
}
```

```typescript
// Validate postMessage communication between MFEs
window.addEventListener('message', (event: MessageEvent) => {

  const ALLOWED_ORIGINS = [
    'https://payments.mybank.com',
    'https://accounts.mybank.com',
    'https://loans.mybank.com'
  ];

  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn(`BLOCKED message from untrusted origin: ${event.origin}`);
    return;
  }

  handleMFEMessage(event.data);
});
```

---

## 3. 🛡️ Strict CSP with Nonces

### What is it?

CSP (Content Security Policy) tells the browser which scripts are allowed to run. A **nonce** is a random secret code generated fresh for every page request — only scripts tagged with the matching nonce will execute.

> Think of it as a **firewall for your browser** — only whitelisted scripts run.

### What is a Nonce?

**Nonce = Number Used Once** — a random secret code that:
1. Is generated fresh on **every single request**
2. Is placed in the **CSP HTTP header**
3. Is placed on every **trusted `<script>` tag**

The browser runs a script **only if** its nonce matches the one in the CSP header. Injected scripts have no nonce → they are blocked.

```
Request 1  → nonce: "K8xP2mQr9T"   (fresh each time)
Request 2  → nonce: "p9mQ7rT2W4"   (completely different)
Request 3  → nonce: "Bx3nL8vK1M"   (completely different)
```

### Key Rules

- ✅ Generate a **new random nonce** for every request
- ✅ Place the nonce on every legitimate `<script>` and `<style>` tag
- ❌ Never use `'unsafe-inline'` — it defeats the entire purpose of CSP
- ❌ Never use `'unsafe-eval'` — allows dangerous `eval()` calls

### What Nonces Protect Against

| Attack | Result |
|--------|--------|
| XSS — hacker injects `<script>` via form input | ❌ BLOCKED — no nonce |
| Third-party CDN gets compromised | ❌ BLOCKED — not in nonce whitelist |
| Browser extension injects tracking code | ❌ BLOCKED — no matching nonce |
| Hacker copies nonce from previous request | ❌ BLOCKED — nonce changes every request |

### Implementation

```typescript
// server.ts — generate nonce and set CSP header on every request
import * as crypto from 'crypto';

app.use((req, res, next) => {

  // Fresh random nonce for every request
  const nonce = crypto.randomBytes(16).toString('base64');

  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy', [
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src  'self' 'nonce-${nonce}'`,
    `default-src 'self'`,
    `object-src 'none'`,          // block Flash, plugins
    `base-uri 'self'`,            // block base tag hijacking
    `frame-ancestors 'none'`,     // block clickjacking
    `report-uri /api/csp-violations`
  ].join('; '));

  next();
});
```

```typescript
// server.ts — inject nonce into index.html
app.get('*', (req, res) => {
  const nonce = res.locals.nonce;

  let html = fs.readFileSync('dist/index.html', 'utf8');
  html = html.replace(/__NONCE__/g, nonce);

  res.send(html);
});
```

```html
<!-- index.html — use __NONCE__ placeholder, server replaces it -->
<head>
  <meta name="csp-nonce" content="__NONCE__" />
  <style nonce="__NONCE__">body { margin: 0; }</style>
</head>
<body>
  <app-root></app-root>
  <script nonce="__NONCE__" src="main.js"></script>
</body>
```

```typescript
// main.ts — pass nonce to Angular's CSP_NONCE token
const nonce = document
  .querySelector('meta[name="csp-nonce"]')
  ?.getAttribute('content') ?? '';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: CSP_NONCE, useValue: nonce }
  ]
});
```

```typescript
// mfe-script-loader.service.ts — dynamic MFE scripts also need the nonce
@Injectable({ providedIn: 'root' })
export class MfeScriptLoaderService {

  constructor(@Inject(CSP_NONCE) private nonce: string) {}

  loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.nonce = this.nonce;  // must set nonce on dynamic scripts too
      script.onload  = () => resolve();
      script.onerror = () => reject(`Failed to load: ${url}`);
      document.head.appendChild(script);
    });
  }
}
```

```typescript
// csp-violation.controller.ts — monitor and alert on violations
app.post('/api/csp-violations', (req, res) => {
  const report = req.body['csp-report'];

  console.error('CSP VIOLATION DETECTED:', {
    what_was_blocked: report['blocked-uri'],
    which_rule:       report['violated-directive'],
    which_page:       report['document-uri'],
    when:             new Date().toISOString()
  });

  // Possible XSS attack — alert security team immediately
  securityAlerts.sendAlert({
    severity: 'HIGH',
    message: `Possible XSS attempt blocked on ${report['document-uri']}`
  });

  res.status(204).end();
});
```

### CSP Approach Comparison

| Approach | Security | Recommended? |
|----------|----------|-------------|
| `unsafe-inline` (no CSP) | ❌ Worst | Never in banking |
| URL Whitelist only | ⚠️ Medium | Not enough for banking |
| **Nonce-based** | ✅ Strong | ✅ YES — Best for SPAs |
| Hash-based | ✅ Strong | For static content only |

---

## 4. 🚪 API Gateway Enforcement

### What is it?

All MFE traffic goes through a **single gateway** before reaching backend services. The gateway acts as a security checkpoint — verifying tokens, checking permissions, rate limiting, and logging every request.

> Think of it as a **security checkpoint at a bank entrance** — verify identity, check permissions, log everything, block suspicious activity.

### Key Rules

- ✅ ALL API requests route through the gateway — no exceptions
- ✅ Each MFE's token is checked for **correct scope** before the request passes
- ❌ Never let MFEs call backend services directly
- ❌ Never trust client-side permission checks alone — enforce on the gateway

### Architecture

```
MFE Requests  →  API GATEWAY
                  │
                  ├── 1. Verify JWT token
                  ├── 2. Check scopes/permissions
                  ├── 3. Rate limit (e.g., 50 req/min for payments)
                  ├── 4. WAF — block SQL injection / XSS attempts
                  └── 5. Log every request with correlation ID
                             │              │
                      Payments API    Accounts API
```

### Implementation

```typescript
// api-gateway.interceptor.ts — attaches scoped token to every outgoing request
@Injectable()
export class ApiGatewayInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!req.url.startsWith('https://api.mybank.com')) {
      return next.handle(req);
    }

    const mfeName = this.getMFEName();
    const token   = this.tokenService.getToken(mfeName);

    const secureReq = req.clone({
      setHeaders: {
        'Authorization':    `Bearer ${token}`,
        'X-MFE-Name':       mfeName,
        'X-Correlation-ID': this.generateId(),   // trace requests across services
        'X-Request-Time':   Date.now().toString()
      }
    });

    return next.handle(secureReq).pipe(
      catchError((error: HttpErrorResponse) => {

        if (error.status === 401) {
          return this.refreshAndRetry(secureReq, next);
        }

        if (error.status === 403) {
          this.auditLog.record('UNAUTHORIZED_ACCESS_ATTEMPT', mfeName, req.url);
        }

        if (error.status === 429) {
          return this.retryWithBackoff(secureReq, next);
        }

        return throwError(() => error);
      })
    );
  }
}
```

```typescript
// app.module.ts — register interceptor globally for all MFEs
providers: [
  {
    provide:  HTTP_INTERCEPTORS,
    useClass: ApiGatewayInterceptor,
    multi:    true
  }
]
```

```yaml
# Gateway policy — enforced SERVER SIDE (MFEs cannot bypass this)
routes:
  - path: /api/payments/*
    allowed_scopes: ['payments:read', 'payments:write']
    rate_limit: 50/minute
    require_mfa: true

  - path: /api/accounts/*
    allowed_scopes: ['accounts:read']
    rate_limit: 100/minute

  - path: /api/admin/*
    allowed_scopes: ['admin:full']
    allowed_ips: ['10.0.0.0/8']   # internal network only
    rate_limit: 10/minute
```

---

## 🗝️ How All 4 Work Together

```
User logs in
     │
     ▼
Gateway issues SCOPED tokens per MFE      ← Token Isolation
     │
     ▼
Shell loads MFEs only from mybank.com     ← Origin Validation
     │
     ▼
Browser blocks any injected scripts       ← Strict CSP with Nonces
     │
     ▼
Every API call verified at the Gateway    ← API Gateway Enforcement
     │
     ▼
Safe Banking Experience 🏦
```

These 4 work as **defence-in-depth layers** — even if one fails, the others catch it.

---

## 📚 References

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Angular Security Guide](https://angular.dev/best-practices/security)
- [OAuth 2.0 Token Best Practices (RFC 9700)](https://datatracker.ietf.org/doc/html/rfc9700)
- [OWASP MFE Security](https://owasp.org/www-project-web-security-testing-guide/)
