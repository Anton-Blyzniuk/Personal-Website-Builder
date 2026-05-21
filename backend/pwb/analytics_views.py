import hashlib
from datetime import timedelta
from urllib.parse import urlparse

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDay
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import PWBUnit, PWBUnitEngagement, PWBUnitView
from .serializers import PWBUnitEngagementSerializer


class TrackViewThrottle(AnonRateThrottle):
    scope = "track_view"


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request) -> str:
    import os
    # Only trust X-Forwarded-For when running behind a trusted proxy (CDN/load balancer).
    # Set TRUST_PROXY_IP=1 in env when deployed on Heroku, Railway, etc.
    if os.environ.get("TRUST_PROXY_IP", "").lower() in ("1", "true"):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode('utf-8')).hexdigest()


def _detect_device(user_agent: str) -> str:
    ua = user_agent.lower()
    if any(kw in ua for kw in [
        'bot', 'crawl', 'spider', 'slurp', 'facebot', 'mediapartners',
        'googlebot', 'bingbot', 'lighthouse', 'pagespeed', 'headless',
        'python-requests', 'curl/', 'wget/',
    ]):
        return 'bot'
    if any(kw in ua for kw in ['ipad', 'tablet', 'kindle', 'playbook', 'silk']):
        return 'tablet'
    if any(kw in ua for kw in [
        'mobile', 'android', 'iphone', 'ipod', 'windows phone', 'blackberry', 'opera mini',
    ]):
        return 'mobile'
    return 'desktop'


def _extract_domain(referrer: str) -> str:
    if not referrer:
        return ''
    try:
        host = urlparse(referrer).netloc.lower()
        host = host.removeprefix('www.')
        return host[:100]
    except Exception:
        return ''


# ---------------------------------------------------------------------------
# Public utility used by the viewset to record API reads
# ---------------------------------------------------------------------------

def record_view(pwb_unit: PWBUnit, request, source: str) -> None:
    ip = _get_client_ip(request)
    ua = request.META.get('HTTP_USER_AGENT', '')
    device_type = _detect_device(ua)
    if device_type == 'bot':
        return
    referrer_raw = request.META.get('HTTP_REFERER', '')
    PWBUnitView.objects.create(
        pwb_unit=pwb_unit,
        source=source,
        ip_hash=_hash_ip(ip) if ip else '',
        device_type=device_type,
        referrer=_extract_domain(referrer_raw),
    )


# ---------------------------------------------------------------------------
# Track endpoint (public POST — called by the CV template page)
# ---------------------------------------------------------------------------

class TrackViewAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [TrackViewThrottle]

    @extend_schema(
        summary="Record a PWBUnit view",
        description="Called by the public CV template to record a web visit.",
        responses={204: None, 404: OpenApiResponse(description="Unit not found")},
        tags=["analytics"],
    )
    def post(self, request, unit_name):
        pwb_unit = get_object_or_404(PWBUnit, unit_name=unit_name)
        # Prefer referrer from request body (client passes document.referrer);
        # fall back to HTTP Referer header which may be stripped by browser policy.
        body_referrer = request.data.get('referrer', '') if hasattr(request, 'data') else ''
        if body_referrer:
            request.META['HTTP_REFERER'] = body_referrer
        record_view(pwb_unit, request, source='web')
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Analytics endpoint (owner-only GET)
# ---------------------------------------------------------------------------

class AnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

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
    def get(self, request, unit_name):
        pwb_unit = get_object_or_404(PWBUnit, unit_name=unit_name)
        if pwb_unit.owner != request.user:
            raise PermissionDenied()

        try:
            period_days = int(request.query_params.get('period', 30))
        except (ValueError, TypeError):
            period_days = 30
        period_days = max(7, min(period_days, 365))

        since = timezone.now() - timedelta(days=period_days)
        qs = PWBUnitView.objects.filter(pwb_unit=pwb_unit, timestamp__gte=since)

        total_views    = qs.count()
        unique_visitors = qs.exclude(ip_hash='').values('ip_hash').distinct().count()
        web_views      = qs.filter(source=PWBUnitView.SOURCE_WEB).count()
        api_views      = qs.filter(source=PWBUnitView.SOURCE_API).count()
        all_time_total = PWBUnitView.objects.filter(pwb_unit=pwb_unit).count()

        # Daily buckets (DB query)
        daily_raw = (
            qs.annotate(day=TruncDay('timestamp'))
            .values('day')
            .annotate(
                total=Count('id'),
                web=Count('id', filter=Q(source=PWBUnitView.SOURCE_WEB)),
                api=Count('id', filter=Q(source=PWBUnitView.SOURCE_API)),
            )
            .order_by('day')
        )
        daily_map = {
            row['day'].date(): {'total': row['total'], 'web': row['web'], 'api': row['api']}
            for row in daily_raw
        }

        # Fill every day in the range (zero-fill gaps)
        today = timezone.now().date()
        views_over_time = []
        for i in range(period_days):
            d = today - timedelta(days=period_days - 1 - i)
            entry = daily_map.get(d, {'total': 0, 'web': 0, 'api': 0})
            views_over_time.append({'date': d.isoformat(), **entry})

        # Device breakdown
        device_rows = qs.values('device_type').annotate(count=Count('id'))
        by_device = {(row['device_type'] or 'unknown'): row['count'] for row in device_rows}

        # Top referrers
        top_referrers = list(
            qs.exclude(referrer='')
            .values('referrer')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # ── Engagement metrics ──────────────────────────────────────────────
        from collections import Counter

        eng_qs = PWBUnitEngagement.objects.filter(pwb_unit=pwb_unit, timestamp__gte=since)

        eng_total        = eng_qs.count()
        avg_time_on_page = eng_qs.aggregate(avg=Avg('time_on_page'))['avg']
        avg_scroll_depth = eng_qs.aggregate(avg=Avg('scroll_depth'))['avg']

        pdf_downloads = eng_qs.filter(pdf_downloaded=True).count()
        email_clicks  = eng_qs.filter(email_clicked=True).count()
        phone_clicks  = eng_qs.filter(phone_clicked=True).count()

        all_sections = []
        for row in eng_qs.values_list('sections_viewed', flat=True):
            if isinstance(row, list):
                all_sections.extend(row)
        top_sections = [
            {'section': k, 'count': v}
            for k, v in Counter(all_sections).most_common(10)
        ]

        all_links = []
        for row in eng_qs.values_list('links_clicked', flat=True):
            if isinstance(row, list):
                all_links.extend(row)
        top_links_clicked = [
            {'link': k, 'count': v}
            for k, v in Counter(all_links).most_common(10)
        ]

        lang_rows = (
            eng_qs.exclude(language='')
            .values('language')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        by_language = list(lang_rows)

        tz_rows = (
            eng_qs.exclude(timezone='')
            .values('timezone')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        by_timezone = list(tz_rows)

        scheme_rows = eng_qs.values('color_scheme').annotate(count=Count('id'))
        by_color_scheme = {(row['color_scheme'] or 'unknown'): row['count'] for row in scheme_rows}

        conn_rows = (
            eng_qs.exclude(connection_type='')
            .values('connection_type')
            .annotate(count=Count('id'))
        )
        by_connection = {row['connection_type']: row['count'] for row in conn_rows}

        resolutions = []
        for w, h in eng_qs.exclude(screen_width=None).values_list('screen_width', 'screen_height'):
            resolutions.append(f"{w}x{h}")
        top_resolutions = [
            {'resolution': k, 'count': v}
            for k, v in Counter(resolutions).most_common(5)
        ]

        return Response({
            'total_views':    total_views,
            'unique_visitors': unique_visitors,
            'web_views':      web_views,
            'api_views':      api_views,
            'all_time_total': all_time_total,
            'period_days':    period_days,
            'views_over_time': views_over_time,
            'by_source': {'web': web_views, 'api': api_views},
            'by_device':      by_device,
            'top_referrers':  top_referrers,
            'engagement': {
                'total_sessions':    eng_total,
                'avg_time_on_page':  round(avg_time_on_page) if avg_time_on_page is not None else None,
                'avg_scroll_depth':  round(avg_scroll_depth) if avg_scroll_depth is not None else None,
                'pdf_downloads':     pdf_downloads,
                'email_clicks':      email_clicks,
                'phone_clicks':      phone_clicks,
                'top_sections':      top_sections,
                'top_links_clicked': top_links_clicked,
                'by_language':       by_language,
                'by_timezone':       by_timezone,
                'by_color_scheme':   by_color_scheme,
                'by_connection':     by_connection,
                'top_resolutions':   top_resolutions,
            },
        })


# ---------------------------------------------------------------------------
# Track engagement endpoint (public POST — called via navigator.sendBeacon)
# ---------------------------------------------------------------------------

class TrackEngagementThrottle(AnonRateThrottle):
    scope = "track_engagement"


class TrackEngagementAPIView(APIView):
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
            "- Optionally also after 45 s on page (to capture partial data for bounced sessions).\n\n"
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

        ip     = _get_client_ip(request)
        ua     = request.META.get('HTTP_USER_AGENT', '')
        device = _detect_device(ua)

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
