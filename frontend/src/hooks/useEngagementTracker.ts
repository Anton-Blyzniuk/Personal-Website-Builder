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

const EARLY_FLUSH_MS = 45_000;

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
  const type: string = conn.effectiveType ?? '';
  return (['4g', '3g', '2g', 'slow-2g'] as string[]).includes(type) ? type : 'unknown';
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

    loadTime.current = Date.now();
    flushed.current  = false;
    maxScroll.current = 0;
    sections.current  = new Set();
    links.current     = [];
    pdfClicked.current   = false;
    emailClicked.current = false;
    phoneClicked.current = false;

    // ── Scroll depth ──────────────────────────────────────────────────────
    function onScroll() {
      const el  = document.documentElement;
      const pct = el.scrollHeight <= el.clientHeight
        ? 100
        : Math.round((window.scrollY / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > maxScroll.current) maxScroll.current = Math.min(pct, 100);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // capture depth for pages that fit in viewport without scrolling

    // ── Section visibility ────────────────────────────────────────────────
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

    // ── Click tracking ────────────────────────────────────────────────────
    function onDocClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = (anchor as HTMLAnchorElement).href ?? '';
      const text = ((anchor as HTMLAnchorElement).textContent ?? (anchor as HTMLAnchorElement).title ?? '').trim().slice(0, 100);

      let isPdf = !!(anchor as HTMLAnchorElement).download || href.includes('fl_attachment');
      if (!isPdf) { try { isPdf = new URL(href, location.href).pathname.toLowerCase().endsWith('.pdf'); } catch (_) {} }
      if (isPdf) pdfClicked.current = true;
      if (href.startsWith('mailto:')) emailClicked.current = true;
      if (href.startsWith('tel:'))    phoneClicked.current = true;

      if (text && links.current.length < 20 && !links.current.includes(text)) {
        links.current.push(text);
      }
    }
    document.addEventListener('click', onDocClick, { capture: true });

    // ── Payload builder ───────────────────────────────────────────────────
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

    // sendBeacon path — survives tab close
    function flushBeacon() {
      if (flushed.current) return;
      flushed.current = true;
      const base    = apiClient.defaults.baseURL ?? '';
      const url     = `${base}/pwbunits/${unitName}/track-engagement/`;
      const payload = JSON.stringify(buildPayload());
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    }

    // Early fetch while user is still on page (45 s)
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
      flushBeacon();
    };
  }, [unitName]);
}
