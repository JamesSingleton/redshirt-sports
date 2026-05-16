# Main Web Application for Redshirt Sports

## Structure

```
app
├── (auth)/
│   ├── (vote)/
│   │   └── vote/
│   │       └── college/
│   │           └── [sport]/
│   │               └── [division]/
│   │                   ├── confirmation/
│   │                   │   └── page.tsx
│   │                   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   └── layout.tsx
├── [slug]/
│   └── page.tsx              # Article pages
├── __tests__/                # Application tests
├── about/
│   └── page.tsx
├── api/
│   ├── cron/
│   │   └── college/
│   │       └── [sport]/
│   │           └── rankings/
│   │               └── [division]/
│   │                   └── route.ts
│   ├── rss/
│   │   └── feed.xml/
│   │       └── route.ts
│   ├── vote/
│   │   ├── college/
│   │   │   └── [sport]/
│   │   │       └── rankings/
│   │   │           └── [division]/
│   │   │               └── route.ts
│   │   └── route.ts
│   └── webhooks/
│       └── auth/
│           └── route.ts
├── authors/
│   └── [slug]/
│       └── page.tsx
├── college/
│   ├── news/
│   │   ├── page.tsx
│   │   └── sitemap.ts
│   ├── sitemap.ts
│   └── [sport]/
│       ├── news/
│       │   ├── loading.tsx
│       │   ├── page.tsx
│       │   └── [division]/
│       │       ├── page.tsx
│       │       └── [conference]/
│       │           └── page.tsx
│       └── rankings/
│           ├── sitemap.ts
│           └── [division]/
│               └── [year]/
│                   └── [week]/
│                       ├── loading.tsx
│                       └── page.tsx
├── contact/
│   └── page.tsx
├── privacy-policy/
│   └── page.tsx
├── search/
│   ├── loading.tsx
│   └── page.tsx
├── layout.tsx
├── page.tsx                  # Homepage
├── robots.ts
└── sitemap.ts
```
