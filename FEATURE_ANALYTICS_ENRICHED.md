# Feature: Enriched Anonymous-User Analytics

> **AI implementation guide.** Follow every section in order. Do not skip steps. Do not modify any existing
> endpoint signatures, model fields, or frontend API calls — only add. The app has real users in production.

---

## Table of Contents

1. [Goal](#1-goal)
2. [Architecture overview](#2-architecture-overview)
3. [Safety rules](#3-safety-rules)
4. [Backend — new model](#4-backend--new-model)
5. [Backend — migration](#5-backend--migration)
6. [Backend — serializer](#6-backend--serializer)
7. [Backend — new track-engagement view](#7-backend--new-track-engagement-view)
8. [Backend — extend analytics view](#8-backend--extend-analytics-view)
9. [Backend — register URLs](#9-backend--register-urls)
10. [Backend — throttle config](#10-backend--throttle-config)
11. [Backend — admin registration](#11-backend--admin-registration)
12. [Backend — drf-spectacular docs](#12-backend--drf-spectacular-docs)
13. [Frontend — data-collection hook](#13-frontend--data-collection-hook)
14. [Frontend — call the new endpoint](#14-frontend--call-the-new-endpoint)
15. [Frontend — update CVPage](#15-frontend--update-cvpage)
16. [Frontend — update AnalyticsPage](#16-frontend--update-analyticspage)
17. [Frontend — update API types](#17-frontend--update-api-types)
18. [Frontend — update API_DOCS.md](#18-frontend--update-api_docsmd)
19. [Verification checklist](#19-verification-checklist)

---

## 1. Goal

The existing `/track/` endpoint records only a single "page view" event with minimal server-derived data
(IP hash, device type, referrer). We want to collect much richer engagement data that only the browser
knows: time on page, scroll depth, screen size, language, timezone, which links were clicked, which CV
sections were viewed, etc.

The new data must appear in the **Analytics tab** of the dashboard (the existing `AnalyticsPage.tsx`),
giving the PWBUnit owner actionable insight into how visitors interact with their public CV page.

---

## 2. Architecture overview

```
Public CV page (CVPage.tsx)
  │
  ├─ On load  →  POST /api/v1/pwbunits/{unit_name}/track/          (existing, unchanged)
  │
  └─ On unload/beacon  →  POST /api/v1/pwbunits/{unit_name}/track-engagement/   (NEW)
                             body: all browser-collectable data (see §7)

Dashboard Analytics tab
  │
  └─ GET /api/v1/pwbunits/{unit_name}/analytics/    (existing, EXTENDED with new fields)
```

Two separate concerns:
- **Data ingestion** — new endpoint `track-engagement` (public, throttled, fire-and-forget).
- **Data query** — existing `analytics` endpoint gets extra fields in its response (purely additive,
  no breaking change to the existing fields).

---

## 3. Safety rules

> Read before touching any file.

1. **Never modify existing endpoint signatures.** `POST /track/` and `GET /analytics/` must keep their
   current request/response shapes exactly. Only add new fields to the analytics response.
2. **Never remove or rename model fields.** Existing `PWBUnitView` is untouched.
3. **All new fields are nullable / have defaults** — the client may omit any of them; the backend
   must accept partial payloads gracefully.
4. **No migration changes to existing models.** Only create new model `PWBUnitEngagement`.
5. **Frontend changes are purely additive** — existing `analyticsApi.track()` call in `CVPage.tsx`
   stays. Add a second call for the new data.
6. **Use `navigator.sendBeacon`** for the engagement payload so it fires reliably on page close.

---

## 4. Backend — new model

**File:** `backend/pwb/models.py`

Add the following class at the **bottom** of the file, after `PWBUnitView`:

```python
class PWBUnitEngagement(models.Model):
    """Rich engagement snapshot sent by the browser when the visitor leaves the CV page."""

    COLOR_DARK    = 'dark'
    COLOR_LIGHT   = 'light'
    COLOR_UNKNOWN = 'unknown'
    COLOR_CHOICES = [
        (COLOR_DARK,    'Dark'),
        (COLOR_LIGHT,   'Light'),
        (COLOR_UNKNOWN, 'Unknown'),
    ]

    CONN_4G      = '4g'
    CONN_3G      = '3g'
    CONN_2G      = '2g'
    CONN_SLOW_2G = 'slow-2g'
    CONN_UNKNOWN = 'unknown'
    CONN_CHOICES = [
        (CONN_4G,      '4G'),
        (CONN_3G,      '3G'),
        (CONN_2G,      '2G'),
        (CONN_SLOW_2G, 'Slow 2G'),
        (CONN_UNKNOWN, 'Unknown'),
    ]

    pwb_unit     = models.ForeignKey(PWBUnit, on_delete=models.CASCADE, related_name='engagements')
    timestamp    = models.DateTimeField(default=timezone.now)

    # Session identifier — client-generated UUID; lets us group multiple events from same visit
    session_id   = models.CharField(max_length=64, blank=True)

    # Server-derived (same logic as PWBUnitView)
    ip_hash      = models.CharField(max_length=64, blank=True)
    device_type  = models.CharField(max_length=10, blank=True)   # desktop/mobile/tablet/bot

    # Page context
    referrer     = models.CharField(max_length=200, blank=True)
    page_url     = models.CharField(max_length=500, blank=True)

    # Engagement metrics (client-reported)
    time_on_page  = models.PositiveIntegerField(null=True, blank=True)   # seconds
    scroll_depth  = models.PositiveSmallIntegerField(null=True, blank=True)  # 0-100 %

    # Device / browser context
    screen_width   = models.PositiveSmallIntegerField(null=True, blank=True)
    screen_height  = models.PositiveSmallIntegerField(null=True, blank=True)
    viewport_width = models.PositiveSmallIntegerField(null=True, blank=True)
    viewport_height= models.PositiveSmallIntegerField(null=True, blank=True)
    language       = models.CharField(max_length=20, blank=True)   # e.g. "en-US"
    timezone       = models.CharField(max_length=60, blank=True)   # e.g. "Europe/Kyiv"
    color_scheme   = models.CharField(max_length=10, choices=COLOR_CHOICES, blank=True)
    connection_type= models.CharField(max_length=10, choices=CONN_CHOICES, blank=True)

    # Interaction flags
    pdf_downloaded  = models.BooleanField(default=False)
    email_clicked   = models.BooleanField(default=False)
    phone_clicked   = models.BooleanField(default=False)

    # JSON arrays — keep bounded to prevent abuse
    # links_clicked: list of strings (link names), max 20 entries, each max 100 chars
    # sections_viewed: list of strings (section identifiers), max 20 entries
    links_clicked  = models.JSONField(default=list, blank=True)
    sections_viewed= models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['pwb_unit', 'timestamp'], name='pwb_eng_unit_time_idx'),
        ]

    def __str__(self):
        return f"{self.pwb_unit.unit_name} engagement [{self.session_id[:8]}]"
```

---

## 5. Backend — migration

Run:
```bash
python manage.py makemigrations pwb --name add_pwbunit_engagement
```

The generated migration will be in `backend/pwb/migrations/0008_add_pwbunit_engagement.py`
(or the next available number). Do not edit it.

---

## 6. Backend — serializer

**File:** `backend/pwb/serializers.py`

Add at the bottom (do not touch existing serializers):

```python
from rest_framework import serializers


class PWBUnitEngagementSerializer(serializers.Serializer):
    """
    Validates the payload from the browser engagement beacon.
    Every field is optional — partial data is always accepted.
    """
    session_id      = serializers.CharField(max_length=64,  required=False, allow_blank=True, default='')
    referrer        = serializers.CharField(max_length=200,  required=False, allow_blank=True, default='')
    page_url        = serializers.CharField(max_length=500,  required=False, allow_blank=True, default='')

    time_on_page    = serializers.IntegerField(min_value=0, max_value=86400, required=False, allow_null=True, default=None)
    scroll_depth    = serializers.IntegerField(min_value=0, max_value=100,   required=False, allow_null=True, default=None)

    screen_width    = serializers.IntegerField(min_value=0, max_value=10000, required=False, allow_null=True, default=None)
    screen_height   = serializers.IntegerField(min_value=0, max_value=10000, required=False, allow_null=True, default=None)
    viewport_width  = serializers.IntegerField(min_value=0, max_value=10000, required=False, allow_null=True, default=None)
    viewport_height = serializers.IntegerField(min_value=0, max_value=10000, required=False, allow_null=True, default=None)
    language        = serializers.CharField(max_length=20,   required=False, allow_blank=True, default='')
    timezone        = serializers.CharField(max_length=60,   required=False, allow_blank=True, default='')
    color_scheme    = serializers.ChoiceField(
        choices=['dark', 'light', 'unknown', ''],
        required=False, allow_blank=True, default=''
    )
    connection_type = serializers.ChoiceField(
        choices=['4g', '3g', '2g', 'slow-2g', 'unknown', ''],
        required=False, allow_blank=True, default=''
    )

    pdf_downloaded  = serializers.BooleanField(required=False, default=False)
    email_clicked   = serializers.BooleanField(required=False, default=False)
    phone_clicked   = serializers.BooleanField(required=False, default=False)

    links_clicked   = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, default=list, max_length=20
    )
    sections_viewed = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False, default=list, max_length=20
    )
```

**Note:** `PWBUnitEngagementSerializer` is a plain `Serializer` (not `ModelSerializer`) so validation
stays separate from persistence; the view handles the DB write.

---

## 7. Backend — new track-engagement view

**File:** `backend/pwb/analytics_views.py`

Add these imports at the top (merge with existing ones — do not duplicate):

```python
# Add to existing imports:
from .models import PWBUnit, PWBUnitView, PWBUnitEngagement
from .serializers import PWBUnitEngagementSerializer
```

Add a new throttle class and view at the **bottom** of `analytics_views.py`:

```python
class TrackEngagementThrottle(AnonRateThrottle):
    scope = "track_engagement"


class TrackEngagementAPIView(APIView):
    """
    POST /api/v1/pwbunits/{unit_name}/track-engagement/

    Public endpoint called by the CV page (via navigator.sendBeacon) when the visitor
    leaves or when enough engagement data has accumulated. Accepts a JSON body with
    rich browser-collected data.

    All fields are optional — send only what the browser has available.
    Returns 204 No Content on success (fire-and-forget; client ignores the response).

    ## How to use from the frontend

    Collect data progressively during the user's visit and flush it with sendBeacon
    just before the page unloads:

    ```ts
    const payload = JSON.stringify({
      session_id:      sessionStorage.getItem('pwb_session') ?? '',
      referrer:        document.referrer,
      page_url:        window.location.href,
      time_on_page:    Math.round((Date.now() - pageLoadTime) / 1000),
      scroll_depth:    maxScrollDepth,               // 0-100
      screen_width:    window.screen.width,
      screen_height:   window.screen.height,
      viewport_width:  window.innerWidth,
      viewport_height: window.innerHeight,
      language:        navigator.language,
      timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
      color_scheme:    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      connection_type: (navigator as any).connection?.effectiveType ?? 'unknown',
      pdf_downloaded:  pdfWasClicked,
      email_clicked:   emailWasClicked,
      phone_clicked:   phoneWasClicked,
      links_clicked:   clickedLinkNames,   // string[]
      sections_viewed: visibleSections,    // string[]
    });

    navigator.sendBeacon(
      `/api/v1/pwbunits/${unitName}/track-engagement/`,
      new Blob([payload], { type: 'application/json' })
    );
    ```

    sendBeacon is used instead of fetch so the request survives page close/navigation.
    The endpoint always returns 204 — never block UX on this call.
    """

    permission_classes = [AllowAny]
    throttle_classes   = [TrackEngagementThrottle]

    @extend_schema(
        summary="Record rich engagement data for a PWBUnit visit",
        description=(
            "Public endpoint. Called by the CV template page via `navigator.sendBeacon` "
            "when the visitor leaves or after a defined engagement interval.\n\n"
            "All body fields are **optional** — send only what the browser has available. "
            "The server fills in device type and IP hash from the request headers.\n\n"
            "### When to call\n"
            "- On `pagehide` / `beforeunload` (use `navigator.sendBeacon` — survives tab close).\n"
            "- Optionally also after 60 s on page (to capture partial data for bounced sessions).\n\n"
            "### Session ID\n"
            "Generate a UUID on page load and store it in `sessionStorage` under key `pwb_session`. "
            "Include it in every call so the analytics API can correlate the engagement record with "
            "the matching view record.\n\n"
            "### Scroll depth\n"
            "Track the maximum `window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100` "
            "achieved during the visit. Clamp to 0–100.\n\n"
            "### Sections viewed\n"
            "Use `IntersectionObserver` on the CV section root elements. Pass the section identifier "
            "string (e.g. `'experience'`, `'skills'`, `'portfolio'`) when it reaches ≥30% visibility."
        ),
        request=PWBUnitEngagementSerializer,
        responses={
            204: OpenApiResponse(description="Engagement recorded — no response body"),
            400: OpenApiResponse(description="Validation error"),
            404: OpenApiResponse(description="Unit not found"),
            429: OpenApiResponse(description="Rate limit exceeded"),
        },
        tags=["analytics"],
    )
    def post(self, request, unit_name):
        pwb_unit = get_object_or_404(PWBUnit, unit_name=unit_name)

        serializer = PWBUnitEngagementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        ip      = _get_client_ip(request)
        ua      = request.META.get('HTTP_USER_AGENT', '')
        device  = _detect_device(ua)

        if device == 'bot':
            return Response(status=status.HTTP_204_NO_CONTENT)

        referrer = data['referrer'] or _extract_domain(request.META.get('HTTP_REFERER', ''))

        eng_fields = dict(
            ip_hash         = _hash_ip(ip) if ip else '',
            device_type     = device,
            referrer        = referrer[:200],
            page_url        = data['page_url'][:500],
            time_on_page    = data['time_on_page'],
            scroll_depth    = data['scroll_depth'],
            screen_width    = data['screen_width'],
            screen_height   = data['screen_height'],
            viewport_width  = data['viewport_width'],
            viewport_height = data['viewport_height'],
            language        = data['language'][:20],
            timezone        = data['timezone'][:60],
            color_scheme    = data['color_scheme'],
            connection_type = data['connection_type'],
            pdf_downloaded  = data['pdf_downloaded'],
            email_clicked   = data['email_clicked'],
            phone_clicked   = data['phone_clicked'],
            links_clicked   = data['links_clicked'],
            sections_viewed = data['sections_viewed'],
        )

        session_id = data['session_id']
        if session_id:
            # Upsert: early-flush and pagehide both send the same session_id.
            # Always overwrite with the latest payload so the final beacon
            # (which has the most complete click/scroll data) wins.
            PWBUnitEngagement.objects.update_or_create(
                pwb_unit   = pwb_unit,
                session_id = session_id,
                defaults   = eng_fields,
            )
        else:
            PWBUnitEngagement.objects.create(
                pwb_unit=pwb_unit, session_id='', **eng_fields
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

## 8. Backend — extend analytics view

**File:** `backend/pwb/analytics_views.py`

In `AnalyticsAPIView.get()`, add the engagement query block **before** the final `return Response(...)`.
Insert new imports at the top if not already present:

```python
from django.db.models import Avg, Sum
```

Add this block inside `AnalyticsAPIView.get()`, just before `return Response({...})`:

```python
        # ── Engagement metrics ──────────────────────────────────────────────
        from .models import PWBUnitEngagement  # local import avoids circular if needed

        eng_qs = PWBUnitEngagement.objects.filter(pwb_unit=pwb_unit, timestamp__gte=since)

        eng_total        = eng_qs.count()
        avg_time_on_page = eng_qs.aggregate(avg=Avg('time_on_page'))['avg']
        avg_scroll_depth = eng_qs.aggregate(avg=Avg('scroll_depth'))['avg']

        pdf_downloads    = eng_qs.filter(pdf_downloaded=True).count()
        email_clicks     = eng_qs.filter(email_clicked=True).count()
        phone_clicks     = eng_qs.filter(phone_clicked=True).count()

        # Top sections viewed (flatten JSONField array, count occurrences)
        from django.db.models.functions import JSONObject
        from collections import Counter
        all_sections = []
        for row in eng_qs.values_list('sections_viewed', flat=True):
            if isinstance(row, list):
                all_sections.extend(row)
        top_sections = [
            {'section': k, 'count': v}
            for k, v in Counter(all_sections).most_common(10)
        ]

        # Top clicked links
        all_links = []
        for row in eng_qs.values_list('links_clicked', flat=True):
            if isinstance(row, list):
                all_links.extend(row)
        top_links_clicked = [
            {'link': k, 'count': v}
            for k, v in Counter(all_links).most_common(10)
        ]

        # Language breakdown
        lang_rows = (
            eng_qs.exclude(language='')
            .values('language')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        by_language = list(lang_rows)

        # Timezone breakdown
        tz_rows = (
            eng_qs.exclude(timezone='')
            .values('timezone')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        by_timezone = list(tz_rows)

        # Color scheme breakdown
        scheme_rows = eng_qs.values('color_scheme').annotate(count=Count('id'))
        by_color_scheme = {(row['color_scheme'] or 'unknown'): row['count'] for row in scheme_rows}

        # Connection type breakdown
        conn_rows = eng_qs.exclude(connection_type='').values('connection_type').annotate(count=Count('id'))
        by_connection = {row['connection_type']: row['count'] for row in conn_rows}

        # Screen resolution (top 5 most common "WxH" strings)
        from collections import Counter as _C
        resolutions = []
        for w, h in eng_qs.exclude(screen_width=None).values_list('screen_width', 'screen_height'):
            resolutions.append(f"{w}x{h}")
        top_resolutions = [
            {'resolution': k, 'count': v}
            for k, v in _C(resolutions).most_common(5)
        ]
```

Then extend the `return Response({...})` dict with new keys (keep all existing keys, just add):

```python
        return Response({
            # ── existing keys — DO NOT CHANGE ──────────────────────────────
            'total_views':      total_views,
            'unique_visitors':  unique_visitors,
            'web_views':        web_views,
            'api_views':        api_views,
            'all_time_total':   all_time_total,
            'period_days':      period_days,
            'views_over_time':  views_over_time,
            'by_source':        {'web': web_views, 'api': api_views},
            'by_device':        by_device,
            'top_referrers':    top_referrers,

            # ── new engagement keys ─────────────────────────────────────────
            'engagement': {
                'total_sessions':    eng_total,
                'avg_time_on_page':  round(avg_time_on_page) if avg_time_on_page is not None else None,
                'avg_scroll_depth':  round(avg_scroll_depth) if avg_scroll_depth is not None else None,
                'pdf_downloads':     pdf_downloads,
                'email_clicks':      email_clicks,
                'phone_clicks':      phone_clicks,
                'top_sections':      top_sections,       # [{section, count}]
                'top_links_clicked': top_links_clicked,  # [{link, count}]
                'by_language':       by_language,        # [{language, count}]
                'by_timezone':       by_timezone,        # [{timezone, count}]
                'by_color_scheme':   by_color_scheme,    # {dark: N, light: N, ...}
                'by_connection':     by_connection,      # {4g: N, 3g: N, ...}
                'top_resolutions':   top_resolutions,    # [{resolution, count}]
            },
        })
```

**Why a nested `engagement` key?** Keeps the response backwards-compatible. Clients that don't know
about engagement data simply ignore the key.

---

## 9. Backend — register URLs

**File:** `backend/pwb/urls.py`

Add the import:
```python
from .analytics_views import AnalyticsAPIView, TrackEngagementAPIView, TrackViewAPIView
```

Add the new URL pattern inside `urlpatterns` (right after the existing `track` pattern):
```python
    path("pwbunits/<slug:unit_name>/track-engagement/",
         TrackEngagementAPIView.as_view(), name="pwbunit-track-engagement"),
```

---

## 10. Backend — throttle config

**File:** `backend/core/settings.py`

Add `track_engagement` to `DEFAULT_THROTTLE_RATES` (inside the existing `REST_FRAMEWORK` dict):

```python
        "track_engagement": "60/hour",
```

60 requests/hour per anonymous IP is generous (one early flush at 45 s + one final pagehide beacon per visit).

---

## 11. Backend — admin registration

**File:** `backend/pwb/admin.py`

Register the new model so it's visible in Django admin:

```python
from django.contrib import admin
from .models import PWBUnitEngagement  # add to existing imports

@admin.register(PWBUnitEngagement)
class PWBUnitEngagementAdmin(admin.ModelAdmin):
    list_display  = ('pwb_unit', 'timestamp', 'device_type', 'time_on_page', 'scroll_depth', 'pdf_downloaded')
    list_filter   = ('device_type', 'color_scheme', 'pdf_downloaded', 'email_clicked', 'phone_clicked')
    search_fields = ('pwb_unit__unit_name', 'session_id', 'referrer', 'timezone', 'language')
    readonly_fields = ('timestamp',)
```

---

## 12. Backend — drf-spectacular docs

The `@extend_schema` decorator on `TrackEngagementAPIView` (added in §7) already covers the new endpoint.
The analytics endpoint gets its new `engagement` key documented by updating its `@extend_schema` decorator:

**File:** `backend/pwb/analytics_views.py`

Update the existing `@extend_schema` on `AnalyticsAPIView.get()` — change only the `description` string
to mention the new `engagement` key:

```python
    @extend_schema(
        summary="Get analytics for a PWBUnit",
        description=(
            "Returns view counts, time-series data, source/device breakdown, "
            "and top referrers for the authenticated owner's PWBUnit.\n\n"
            "Also returns an `engagement` object with rich browser-collected metrics "
            "(avg time on page, scroll depth, CTA clicks, section popularity, etc.) "
            "derived from the `/track-engagement/` beacon endpoint.\n\n"
            "Query params:\n"
            "- `period` (int, 7–365, default 30): number of days to aggregate"
        ),
        responses={
            200: OpenApiResponse(description="Analytics data including engagement metrics"),
            403: OpenApiResponse(description="Not the owner"),
        },
        tags=["analytics"],
    )
```

---

## 13. Frontend — data-collection hook

**File:** `frontend/src/hooks/useEngagementTracker.ts`  *(create new file)*

```ts
/**
 * useEngagementTracker
 *
 * Collects all browser-available engagement data during a CV page visit and
 * sends it to the track-engagement endpoint when the visitor leaves.
 *
 * Usage:
 *   useEngagementTracker(unitName);   // call once in CVPage
 *
 * The hook fires a sendBeacon on pagehide (works even when the tab closes).
 * It also fires after EARLY_FLUSH_MS milliseconds so we capture partial data
 * for visitors who leave very quickly.
 *
 * Nothing is sent until unitName is truthy and the hook has mounted.
 */

import { useEffect, useRef } from 'react';
import { apiClient } from '../lib/api';

const EARLY_FLUSH_MS = 45_000; // flush partial data after 45 s even if user stays

function getOrCreateSessionId(): string {
  const KEY = 'pwb_session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function getConnectionType(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (!conn) return 'unknown';
  const type = conn.effectiveType ?? '';
  return ['4g', '3g', '2g', 'slow-2g'].includes(type) ? type : 'unknown';
}

export function useEngagementTracker(unitName: string | undefined): void {
  const loadTime     = useRef(Date.now());
  const maxScroll    = useRef(0);
  const sections     = useRef<Set<string>>(new Set());
  const links        = useRef<string[]>([]);
  const pdfClicked   = useRef(false);
  const emailClicked = useRef(false);
  const phoneClicked = useRef(false);
  const flushed      = useRef(false);

  useEffect(() => {
    if (!unitName) return;

    loadTime.current  = Date.now();
    flushed.current   = false;

    // ── Scroll depth ────────────────────────────────────────────────────────
    function onScroll() {
      const el  = document.documentElement;
      const pct = el.scrollHeight <= el.clientHeight
        ? 100
        : Math.round((window.scrollY / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > maxScroll.current) maxScroll.current = Math.min(pct, 100);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // capture depth for pages that fit in viewport without scrolling

    // ── Section visibility (IntersectionObserver) ────────────────────────────
    // CV templates should add data-section="experience" etc. to section roots.
    // If not yet present, add data-section attributes to template root elements.
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const name = (e.target as HTMLElement).dataset.section;
            if (name) sections.current.add(name);
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll('[data-section]').forEach((el) => sectionObserver.observe(el));

    // ── Click tracking ───────────────────────────────────────────────────────
    function onDocClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.href ?? '';
      const text = (anchor.textContent ?? anchor.title ?? '').trim().slice(0, 100);

      let isPdf = !!anchor.download || href.includes('fl_attachment');
      if (!isPdf) { try { isPdf = new URL(href, location.href).pathname.toLowerCase().endsWith('.pdf'); } catch (_) {} }
      if (isPdf) pdfClicked.current = true;
      if (href.startsWith('mailto:')) {
        emailClicked.current = true;
      }
      if (href.startsWith('tel:')) {
        phoneClicked.current = true;
      }

      // Record external link label (deduplicated, max 20)
      if (text && links.current.length < 20 && !links.current.includes(text)) {
        links.current.push(text);
      }
    }
    document.addEventListener('click', onDocClick, { capture: true });

    // ── Flush helper ─────────────────────────────────────────────────────────
    function buildPayload() {
      return {
        session_id:      getOrCreateSessionId(),
        referrer:        document.referrer,
        page_url:        window.location.href,
        time_on_page:    Math.round((Date.now() - loadTime.current) / 1000),
        scroll_depth:    maxScroll.current,
        screen_width:    window.screen.width,
        screen_height:   window.screen.height,
        viewport_width:  window.innerWidth,
        viewport_height: window.innerHeight,
        language:        navigator.language,
        timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
        color_scheme:    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        connection_type: getConnectionType(),
        pdf_downloaded:  pdfClicked.current,
        email_clicked:   emailClicked.current,
        phone_clicked:   phoneClicked.current,
        links_clicked:   [...links.current],
        sections_viewed: [...sections.current],
      };
    }

    // sendBeacon path (on unload) — does not require response
    function flushBeacon() {
      if (flushed.current) return;
      flushed.current = true;
      const url     = `${apiClient.defaults.baseURL ?? ''}/pwbunits/${unitName}/track-engagement/`;
      const payload = JSON.stringify(buildPayload());
      const sent    = navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      if (!sent) {
        // sendBeacon may return false if queue is full; best-effort only
      }
    }

    // Fetch path (early flush while user is still on page).
    // Does NOT set flushed=true — pagehide will fire again with the final complete payload.
    // The backend uses update_or_create on session_id so both payloads merge (latest wins).
    function flushFetch() {
      if (flushed.current) return;
      apiClient
        .post(`/pwbunits/${unitName}/track-engagement/`, buildPayload())
        .catch(() => {});
    }

    window.addEventListener('pagehide', flushBeacon);
    const earlyTimer = setTimeout(flushFetch, EARLY_FLUSH_MS);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', flushBeacon);
      document.removeEventListener('click', onDocClick, { capture: true });
      sectionObserver.disconnect();
      clearTimeout(earlyTimer);
      // Flush on component unmount (e.g. SPA navigation away from CV page)
      flushBeacon();
    };
  }, [unitName]);
}
```

---

## 14. Frontend — call the new endpoint

The hook uses `apiClient.defaults.baseURL` to build the beacon URL. Verify that `apiClient.defaults.baseURL`
is set in `frontend/src/lib/api.ts`. If it is not set (relative URLs used), the beacon URL builder in
the hook must use a different approach. Check and adapt:

```ts
// In useEngagementTracker.ts — beacon URL construction:
// If apiClient.defaults.baseURL is undefined (relative API), use:
const base = typeof window !== 'undefined' ? window.location.origin : '';
const url  = `${base}/api/v1/pwbunits/${unitName}/track-engagement/`;
```

Inspect `frontend/src/lib/api.ts` and make the URL construction match however `apiClient` sets its base.

---

## 15. Frontend — update CVPage

**File:** `frontend/src/pages/CVPage.tsx`

Add the new hook import and call. The existing `analyticsApi.track()` call remains unchanged.

```tsx
import { useEngagementTracker } from '../hooks/useEngagementTracker';
```

Inside `CVPage()` function body, add the hook call (after the existing `useQuery` calls):

```tsx
  // Rich engagement tracking — fires sendBeacon on page leave
  useEngagementTracker(unit?.unit_name);
```

Also add `data-section` attributes to CV template root section elements so the `IntersectionObserver`
in the hook can detect which sections were viewed. This must be done in all three templates:
`ClassicTemplate.tsx`, `ModernTemplate.tsx`, `MinimalTemplate.tsx`.

In each template, find the outer `<section>` or containing `<div>` for each CV section and add the
`data-section` attribute. Standard section names to use:

| Section | `data-section` value |
|---------|----------------------|
| Contact / basic info | `"contact"` |
| Skills | `"skills"` |
| Experience | `"experience"` |
| Education | `"education"` |
| Portfolio | `"portfolio"` |
| Certifications | `"certifications"` |
| Awards | `"awards"` |
| Languages | `"languages"` |
| Links / social | `"links"` |
| Custom sections | `"custom-{title}"` (lowercase slug) |

Example — in ClassicTemplate.tsx, find the skills section wrapper and add:
```tsx
<section data-section="skills">
  {/* ... existing content ... */}
</section>
```

Do this for every section in every template. Do not change any existing className, layout, or logic.

---

## 16. Frontend — update AnalyticsPage

**File:** `frontend/src/pages/AnalyticsPage.tsx`

Add new UI panels to display the engagement data. The `data.engagement` object can be `undefined`
(for old records before the feature shipped) — always null-check before rendering.

### 16a. Update `AnalyticsContent` component

After the existing "Top referrers" block, add the following engagement panels:

```tsx
{/* ── Engagement metrics ──────────────────────────────────────────── */}
{data.engagement && (
  <>
    {/* Engagement stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {data.engagement.avg_time_on_page !== null && (
        <StatCard
          label="Avg time on page"
          value={data.engagement.avg_time_on_page}
          icon={<Clock className="h-5 w-5 text-cyan-400" />}
          accent="bg-cyan-500/10"
          unit="s"
        />
      )}
      {data.engagement.avg_scroll_depth !== null && (
        <StatCard
          label="Avg scroll depth"
          value={data.engagement.avg_scroll_depth}
          icon={<ArrowDownToLine className="h-5 w-5 text-indigo-400" />}
          accent="bg-indigo-500/10"
          unit="%"
        />
      )}
      <StatCard
        label="PDF downloads"
        value={data.engagement.pdf_downloads}
        icon={<FileDown className="h-5 w-5 text-orange-400" />}
        accent="bg-orange-500/10"
      />
      <StatCard
        label="Email clicks"
        value={data.engagement.email_clicks}
        icon={<Mail className="h-5 w-5 text-rose-400" />}
        accent="bg-rose-500/10"
      />
    </div>

    {/* Sections viewed + Links clicked */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.engagement.top_sections.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Sections viewed</p>
          <div className="space-y-2">
            {data.engagement.top_sections.map((s, i) => {
              const pct = Math.round((s.count / data.engagement!.top_sections[0].count) * 100);
              return (
                <div key={s.section} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 dark:text-slate-600 w-4 text-right text-xs shrink-0">{i + 1}</span>
                  <span className="text-slate-600 dark:text-slate-400 flex-1 capitalize">{s.section}</span>
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-8 text-right shrink-0">{fmt(s.count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.engagement.top_links_clicked.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Links clicked</p>
          <div className="space-y-2">
            {data.engagement.top_links_clicked.map((l, i) => {
              const pct = Math.round((l.count / data.engagement!.top_links_clicked[0].count) * 100);
              return (
                <div key={l.link} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 dark:text-slate-600 w-4 text-right text-xs shrink-0">{i + 1}</span>
                  <span className="text-slate-600 dark:text-slate-400 flex-1 truncate font-mono text-xs">{l.link}</span>
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-8 text-right shrink-0">{fmt(l.count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Language + Timezone breakdown */}
    {(data.engagement.by_language.length > 0 || data.engagement.by_timezone.length > 0) && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.engagement.by_language.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Languages</p>
            <div className="space-y-2">
              {data.engagement.by_language.map((l) => (
                <div key={l.language} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 flex-1 font-mono text-xs">{l.language}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(l.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.engagement.by_timezone.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Timezones</p>
            <div className="space-y-2">
              {data.engagement.by_timezone.map((t) => (
                <div key={t.timezone} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400 flex-1 font-mono text-xs truncate">{t.timezone}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(t.count)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </>
)}
```

### 16b. Add required icon imports

The new panels use icons from `lucide-react`. Add to existing import:

```tsx
import {
  // ... existing icons ...
  Clock, ArrowDownToLine, FileDown, Mail,
} from 'lucide-react';
```

### 16c. Update `StatCard` to support optional `unit` suffix

```tsx
function StatCard({
  label, value, icon, accent, unit,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  unit?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {fmt(value)}{unit && <span className="text-base font-normal text-slate-400 ml-0.5">{unit}</span>}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
```

---

## 17. Frontend — update API types

**File:** `frontend/src/types/api.ts`

Add after the existing `AnalyticsData` interface:

```ts
export interface EngagementSectionEntry {
  section: string;
  count: number;
}

export interface EngagementLinkEntry {
  link: string;
  count: number;
}

export interface EngagementLanguageEntry {
  language: string;
  count: number;
}

export interface EngagementTimezoneEntry {
  timezone: string;
  count: number;
}

export interface EngagementData {
  total_sessions:    number;
  avg_time_on_page:  number | null;   // seconds, null if no data
  avg_scroll_depth:  number | null;   // 0-100, null if no data
  pdf_downloads:     number;
  email_clicks:      number;
  phone_clicks:      number;
  top_sections:      EngagementSectionEntry[];
  top_links_clicked: EngagementLinkEntry[];
  by_language:       EngagementLanguageEntry[];
  by_timezone:       EngagementTimezoneEntry[];
  by_color_scheme:   Record<string, number>;
  by_connection:     Record<string, number>;
  top_resolutions:   { resolution: string; count: number }[];
}
```

Then extend `AnalyticsData`:

```ts
export interface AnalyticsData {
  // ... existing fields unchanged ...
  engagement?: EngagementData;   // present when engagement records exist; undefined for old data
}
```

---

## 18. Frontend — update API_DOCS.md

**File:** `API_DOCS.md` (project root)

### 18a. Add new endpoint in the Endpoints section

Add a new subsection **after** the existing `Analytics` subsection:

````markdown
### Analytics — Track Engagement

#### `POST /pwbunits/<unit_name>/track-engagement/`

**Public.** No auth required. Throttled: **60 req/hour** per IP.

Called by the public CV template page via `navigator.sendBeacon` when the visitor
leaves or after 45 seconds on page. Accepts rich browser-collected engagement data.
All fields are **optional** — the endpoint accepts any partial subset.

**When to call:**
- On `pagehide` event (use `navigator.sendBeacon` — works even when the tab closes).
- Optionally also after 45 s on page to capture partial data for bounced sessions.

**Session ID:**
Generate a UUID on CV page load, store it in `sessionStorage` under key `pwb_session`,
and include it in every call. This lets the analytics query correlate engagement records
with the matching view record.

**Request** — `application/json`:
```json
{
  "session_id":      "uuid-string",
  "referrer":        "https://linkedin.com",
  "page_url":        "https://app.example.com/cv/john-doe",
  "time_on_page":    87,
  "scroll_depth":    65,
  "screen_width":    1920,
  "screen_height":   1080,
  "viewport_width":  1440,
  "viewport_height": 900,
  "language":        "en-US",
  "timezone":        "Europe/Kyiv",
  "color_scheme":    "dark",
  "connection_type": "4g",
  "pdf_downloaded":  false,
  "email_clicked":   true,
  "phone_clicked":   false,
  "links_clicked":   ["GitHub", "LinkedIn"],
  "sections_viewed": ["experience", "skills", "portfolio"]
}
```

**Field reference:**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `session_id` | string | max 64 chars | Client UUID from `sessionStorage`. Groups events from the same visit. |
| `referrer` | string | max 200 chars | `document.referrer` value. |
| `page_url` | string | max 500 chars | `window.location.href`. |
| `time_on_page` | integer | 0–86400 | Seconds from page load to beacon send. |
| `scroll_depth` | integer | 0–100 | Max scroll percentage reached. |
| `screen_width` | integer | 0–10000 | `window.screen.width`. |
| `screen_height` | integer | 0–10000 | `window.screen.height`. |
| `viewport_width` | integer | 0–10000 | `window.innerWidth`. |
| `viewport_height` | integer | 0–10000 | `window.innerHeight`. |
| `language` | string | max 20 chars | `navigator.language` (e.g. `"en-US"`). |
| `timezone` | string | max 60 chars | `Intl.DateTimeFormat().resolvedOptions().timeZone`. |
| `color_scheme` | string | `dark`, `light`, `unknown` | Preferred color scheme. |
| `connection_type` | string | `4g`, `3g`, `2g`, `slow-2g`, `unknown` | `navigator.connection?.effectiveType`. |
| `pdf_downloaded` | boolean | — | Whether visitor clicked any PDF/attachment link. |
| `email_clicked` | boolean | — | Whether visitor clicked a `mailto:` link. |
| `phone_clicked` | boolean | — | Whether visitor clicked a `tel:` link. |
| `links_clicked` | string[] | max 20 items, each max 100 chars | Text labels of external links clicked. |
| `sections_viewed` | string[] | max 20 items, each max 50 chars | CV section identifiers that entered viewport (≥30% visible). Standard values: `experience`, `education`, `skills`, `portfolio`, `certifications`, `awards`, `languages`, `links`, `contact`. |

**Response 204:** recorded — no body.  
**Response 400:** validation error.  
**Response 404:** unit not found.  
**Response 429:** rate limit exceeded.

**Example — minimal call (just a ping):**
```json
{}
```

**Full JavaScript example using `navigator.sendBeacon`:**
```js
const payload = JSON.stringify({
  session_id:      sessionStorage.getItem('pwb_session') ?? '',
  referrer:        document.referrer,
  page_url:        window.location.href,
  time_on_page:    Math.round((Date.now() - PAGE_LOAD_TIME) / 1000),
  scroll_depth:    MAX_SCROLL_DEPTH,
  screen_width:    window.screen.width,
  screen_height:   window.screen.height,
  viewport_width:  window.innerWidth,
  viewport_height: window.innerHeight,
  language:        navigator.language,
  timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
  color_scheme:    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  connection_type: navigator.connection?.effectiveType ?? 'unknown',
  pdf_downloaded:  PDF_WAS_CLICKED,
  email_clicked:   EMAIL_WAS_CLICKED,
  phone_clicked:   PHONE_WAS_CLICKED,
  links_clicked:   CLICKED_LINK_NAMES,
  sections_viewed: VISIBLE_SECTIONS,
});

navigator.sendBeacon(
  `/api/v1/pwbunits/${unitName}/track-engagement/`,
  new Blob([payload], { type: 'application/json' })
);
```
````

### 18b. Update the Analytics GET endpoint docs

In the existing `GET /pwbunits/<unit_name>/analytics/` section, add a note that the response now
includes an `engagement` key. Append to the existing **Response 200** block:

````markdown
The response also includes an `engagement` object with aggregated data from the
`/track-engagement/` endpoint:

```json
{
  "engagement": {
    "total_sessions":    142,
    "avg_time_on_page":  73,
    "avg_scroll_depth":  68,
    "pdf_downloads":     12,
    "email_clicks":      8,
    "phone_clicks":      3,
    "top_sections":      [{"section": "experience", "count": 98}, ...],
    "top_links_clicked": [{"link": "GitHub", "count": 34}, ...],
    "by_language":       [{"language": "en-US", "count": 80}, ...],
    "by_timezone":       [{"timezone": "Europe/Kyiv", "count": 55}, ...],
    "by_color_scheme":   {"dark": 90, "light": 52},
    "by_connection":     {"4g": 110, "3g": 32},
    "top_resolutions":   [{"resolution": "1920x1080", "count": 45}, ...]
  }
}
```

`engagement` may be `undefined` / absent when no engagement records exist for the period.
All numeric sub-fields inside `engagement` are always present (defaulting to 0 or null).
````

### 18c. Update Throttle Limits table

Add a new row:

```markdown
| `track_engagement` | 60/hour | `POST /pwbunits/{unit_name}/track-engagement/` |
```

---

## 19. Verification checklist

After implementation, verify each point manually:

### Backend
- [ ] `python manage.py makemigrations --check` passes (no unapplied changes after running the migration).
- [ ] `python manage.py migrate` applies the new migration cleanly.
- [ ] `POST /api/v1/pwbunits/test-unit/track-engagement/` with empty JSON body returns 204.
- [ ] `POST /api/v1/pwbunits/test-unit/track-engagement/` with full payload returns 204.
- [ ] `POST /api/v1/pwbunits/nonexistent/track-engagement/` returns 404.
- [ ] `POST /api/v1/pwbunits/test-unit/track-engagement/` with a bot User-Agent returns 204 but creates **no** DB record.
- [ ] `GET /api/v1/pwbunits/test-unit/analytics/` response contains `engagement` key when records exist.
- [ ] `GET /api/v1/pwbunits/test-unit/analytics/` response `engagement` is `{}` or absent when no records exist (do not crash).
- [ ] Swagger UI at `/api/v1/swagger/` shows `track-engagement` endpoint with full field docs.
- [ ] Existing `POST /track/` continues to work unchanged.
- [ ] Existing `GET /analytics/` existing fields (`total_views`, `by_device`, etc.) are unchanged.
- [ ] Django admin shows `PWBUnitEngagement` model with records.

### Frontend
- [ ] Opening a CV page (`/cv/<unit_name>`) — existing view track call fires as before.
- [ ] After 45 s on the CV page, a `POST /track-engagement/` call fires (check Network tab).
- [ ] Closing / navigating away from the CV page triggers a `sendBeacon` call (check Network tab with "Preserve log" enabled in DevTools).
- [ ] The `engagement` section appears in the Analytics page when data exists.
- [ ] The Analytics page does not crash when `data.engagement` is undefined (zero data state).
- [ ] `StatCard` renders correctly with `unit="s"` and `unit="%"` suffixes.
- [ ] All existing Analytics page sections (views chart, device breakdown, referrers) still render correctly.
- [ ] TypeScript compiles with no errors (`npm run build` or `tsc --noEmit`).

### Safety
- [ ] Deleting a `PWBUnit` cascades correctly and removes its `PWBUnitEngagement` records.
- [ ] No existing test in `backend/pwb/tests.py` or `backend/user/tests.py` breaks.
- [ ] `python manage.py test` passes.
