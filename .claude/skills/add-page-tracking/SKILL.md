---
name: add-page-tracking
description: Add analytics tracking to a new page so visits, presence, and engagement appear in the admin panel. Use after creating any new page or landing page.
argument-hint: <page-slug>
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Add Analytics Tracking to a Page

Add full analytics tracking for the page: $ARGUMENTS

This skill ensures every new page has presence tracking, page view tracking, and admin panel visibility.

## Step 1: Identify the Page

Find the page component to add tracking to. The page slug (e.g., "claudecode", "workshops") is the identifier used across all tracking systems.

- Read the page's `page.tsx` to understand if it's a server component or client component
- Determine the page slug — this is the route segment (e.g., for `src/app/workshops/page.tsx` the slug is `"workshops"`)
- Determine a human-readable title for the page (e.g., "Build with Claude Code", "Workshops")

## Step 2: Add PagePresenceTracker

Import and add `PagePresenceTracker` to the page. This tracks live visitors, unique visitors, and country data.

```tsx
import { PagePresenceTracker } from "@/components/PagePresenceTracker";
```

Place it inside the page's JSX, near the top (before visible content):

```tsx
<PagePresenceTracker page="<page-slug>" />
```

**Note:** `PagePresenceTracker` is a `"use client"` component. It can be embedded directly in server components.

The presence API route (`src/app/api/presence/route.ts`) accepts any slug matching `^[a-z0-9-]+$`, so no API changes are needed.

## Step 3: Add Page View Tracker

Create a `PageViewTracker.tsx` client component in the same directory as the page. This tracks total page views (including repeat visits from the same person).

**File:** `src/app/<page-path>/PageViewTracker.tsx`

```tsx
"use client";

import { useEffect } from "react";

export default function PageViewTracker() {
  useEffect(() => {
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "<page-slug>", title: "<Page Title>" }),
    }).catch(() => {});
  }, []);

  return null;
}
```

Then import and place it alongside the `PagePresenceTracker`:

```tsx
import PageViewTracker from "./PageViewTracker";
```

```tsx
<PagePresenceTracker page="<page-slug>" />
<PageViewTracker />
```

**Important:** This reuses the existing `BlogView` database model via `/api/blog/view`. No schema migration needed.

## Step 4: Filter Page Views Out of Blog Analytics

In `src/app/admin/analytics/page.tsx`, the blog metrics queries must exclude the new page slug so page views don't pollute blog stats.

Find the blog metrics section in `getAnalytics()` and add the slug to the exclusion filter. There are 4 queries to update:

1. `prisma.blogView.count(...)` — total blog views
2. `prisma.blogView.count(...)` — today's blog views
3. `prisma.blogView.count(...)` — week's blog views
4. `prisma.blogView.groupBy(...)` — blog views by post

For each, ensure the `where` clause includes `slug: { notIn: [...] }` with the new slug added. Check if existing queries already use `{ not: "claudecode" }` — if so, convert to `{ notIn: ["claudecode", "<new-slug>"] }`.

## Step 5: Add Tracking to Admin Analytics Page

**File:** `src/app/admin/analytics/page.tsx`

### 5a: Add queries to `getAnalytics()`

Add these queries to the existing `Promise.all` array, following the pattern used by the Claude Code presale section:

**Unique visitors** (today / week / all-time):
```typescript
prisma.pagePresence.groupBy({
  by: ["visitorId"],
  where: { page: "<page-slug>", lastSeenAt: { gte: todayStart } },
  _count: true,
}).then(r => r.length),
```
(Repeat with `weekStart` and without date filter for week/all-time)

**Page views** (today / week / all-time):
```typescript
prisma.blogView.count({ where: { slug: "<page-slug>", viewedAt: { gte: todayStart } } }),
```
(Repeat with `weekStart` and without date filter)

**Visitors by country:**
```typescript
prisma.pagePresence.groupBy({
  by: ["country"],
  where: { page: "<page-slug>", country: { not: null } },
  _count: { visitorId: true },
  orderBy: { _count: { visitorId: "desc" } },
  take: 10,
}),
```

### 5b: Add to return object

Add a new key to the return object (use the slug as the key name in camelCase):

```typescript
<pageName>: {
  uniqueToday: ...,
  uniqueWeek: ...,
  uniqueAllTime: ...,
  viewsToday: ...,
  viewsWeek: ...,
  viewsAllTime: ...,
  byCountry: <countryResults>
    .filter((c) => c.country)
    .map((c) => ({
      country: c.country as string,
      countryName: getCountryName(c.country as string),
      visitors: c._count.visitorId,
    })),
},
```

### 5c: Add UI section

Add a section to the analytics page JSX. Follow the existing card styling:

```tsx
<div className="mb-8">
  <h2 className="font-serif text-xl text-[var(--foreground)] mb-4">
    <Page Name>
  </h2>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
    {/* Unique Visitors card with today/week/all-time */}
    {/* Page Views card with today/week/all-time */}
  </div>
  {/* Country breakdown table (if data exists) */}
</div>
```

Use these classes for cards: `bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4`

## Step 6: Add Quick Stat to Admin Dashboard (Optional)

If the page is important enough for at-a-glance monitoring (e.g., presale pages, landing pages):

**File:** `src/app/admin/page.tsx`

Add a query to the `getStats()` Promise.all:
```typescript
prisma.pagePresence.groupBy({
  by: ["visitorId"],
  where: { page: "<page-slug>", lastSeenAt: { gte: todayStart } },
  _count: true,
}).then(r => r.length),
```

Add the result to the return object under `analytics`, then add a card in the "Today's Activity" grid. Use a yellow border for emphasis: `border-2 border-[#ffe500]`.

## Step 7: Verify

1. Run `npx tsc --noEmit` to check for type errors
2. Confirm the page's `PagePresenceTracker` and `PageViewTracker` are rendered (check imports and JSX)
3. Confirm the admin analytics page has the new section with correct data keys
4. Confirm blog stats queries exclude the new slug

## Step 8: Report Results

Tell the user:
- Which page now has tracking
- What's visible in `/admin` (if dashboard card was added)
- What's visible in `/admin/analytics` (the new section)
- Remind them to deploy with `vercel --prod` when ready
