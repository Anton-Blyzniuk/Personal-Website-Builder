import hashlib
from datetime import timedelta
from urllib.parse import urlparse

from django.db.models import Count, Q
from django.db.models.functions import TruncDay
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PWBUnit, PWBUnitView


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request) -> str:
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
    referrer_raw = request.META.get('HTTP_REFERER', '')
    PWBUnitView.objects.create(
        pwb_unit=pwb_unit,
        source=source,
        ip_hash=_hash_ip(ip) if ip else '',
        device_type=_detect_device(ua),
        referrer=_extract_domain(referrer_raw),
    )


# ---------------------------------------------------------------------------
# Track endpoint (public POST — called by the CV template page)
# ---------------------------------------------------------------------------

class TrackViewAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Record a PWBUnit view",
        description="Called by the public CV template to record a web visit. Source must be 'web'.",
        responses={204: None, 404: OpenApiResponse(description="Unit not found")},
        tags=["analytics"],
    )
    def post(self, request, unit_name):
        pwb_unit = get_object_or_404(PWBUnit, unit_name=unit_name)
        source = request.data.get('source', 'web')
        if source not in ('web', 'api'):
            source = 'web'
        record_view(pwb_unit, request, source=source)
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
            "Query params:\n"
            "- `period` (int, 7–365, default 30): number of days to aggregate"
        ),
        responses={200: OpenApiResponse(description="Analytics data"), 403: OpenApiResponse(description="Not the owner")},
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
        })
