"""
signal_engine.py
────────────────────────────────────────────────────────────────────────────────
Plug-in signal engine for the Paper Trading Pro platform.  (RELIABILITY-HARDENED)

HOW IT WORKS (zero heavy ML dependencies):
  ┌─────────────────┐   ┌───────────────────┐   ┌──────────────────────┐
  │  yfinance OHLCV │   │  Google News RSS   │   │  Technical Indicators│
  │  (already used) │   │  (headline text)   │   │  RSI · MACD · EMA    │
  └────────┬────────┘   └────────┬──────────┘   └──────────┬───────────┘
           │                     │                           │
           ▼                     ▼                           ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │            Signal Fusion Engine (dynamic re-weighting)              │
  │   Weights redistribute automatically if a component is unavailable  │
  │   or low-confidence (e.g. no news found, insufficient price data)   │
  └──────────────────────────────┬──────────────────────────────────────┘
                                 ▼
                     BUY / SELL / HOLD + confidence %

WHAT CHANGED VS THE ORIGINAL (see comments tagged "RELIABILITY FIX #n"):
  1. Word-boundary matching for financial booster keywords (was: substring match,
     caused false hits like "risk" inside "brisk", "fall" inside "windfall")
  2. NaN-safe RSI / indicator handling for flat-price / illiquid stocks
  3. Headline de-duplication across the symbol + company-name RSS queries
  4. Sentiment confidence now scales with article count, not just polarity
  5. Composite fusion dynamically re-weights across ONLY the components that
     are actually available/trustworthy, instead of silently treating a
     failed/empty component as a neutral 0.0 that dilutes the real signal
  6. Network timeouts on RSS + yfinance calls (previously could hang forever)
  7. Lightweight in-memory TTL cache so repeated calls in a short window don't
     re-hit yfinance / Google News (avoids rate-limiting during demos)
  8. Every pipeline stage is exception-isolated — one failing component
     degrades gracefully instead of crashing the whole /signal/{symbol} call
  9. Thresholds/weights pulled into named constants at the top, so they're
     easy to tune and to swap in backtested values later

DEPENDENCIES (all already available or tiny):
  pip install feedparser textblob pandas numpy   (no PyTorch / TensorFlow needed)

Add to data_app.py:
  from signal_engine import get_signal
  Then add the /signal/{symbol} route shown at the bottom of this file.
────────────────────────────────────────────────────────────────────────────────
"""

import re
import time
import socket
import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf
import feedparser                 # pip install feedparser
from textblob import TextBlob     # pip install textblob

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# 0.  TUNABLE CONSTANTS  (RELIABILITY FIX #9 — was scattered as magic numbers)
# ─────────────────────────────────────────────────────────────────────────────

NETWORK_TIMEOUT_SEC   = 6        # RSS / socket timeout
CACHE_TTL_PRICE_SEC   = 120      # how long to reuse fetched OHLCV data
CACHE_TTL_NEWS_SEC    = 900      # news moves slower than price, cache longer
MIN_ARTICLES_FOR_FULL_CONF = 5   # below this, sentiment's weight is discounted

W_TECH = 0.35
W_SENT = 0.35
W_TRND = 0.30

BUY_THRESHOLD  = 0.20
SELL_THRESHOLD = -0.20
STRONG_THRESHOLD = 0.50

# ─────────────────────────────────────────────────────────────────────────────
# 0b. TINY TTL CACHE  (RELIABILITY FIX #7)
# ─────────────────────────────────────────────────────────────────────────────

_cache: dict = {}

def _cache_get(key: str, ttl: int):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < ttl:
        return entry[1]
    return None

def _cache_set(key: str, value):
    _cache[key] = (time.time(), value)


# ─────────────────────────────────────────────────────────────────────────────
# 1.  NEWS SENTIMENT  (Google News RSS  →  TextBlob + financial booster scoring)
# ─────────────────────────────────────────────────────────────────────────────

FINANCIAL_BOOSTERS = {
    # strongly positive
    "surge": +0.4, "soar": +0.4, "rally": +0.35, "beat": +0.35,
    "record": +0.3, "profit": +0.3, "growth": +0.25, "buy": +0.2,
    "upgrade": +0.35, "dividend": +0.25, "breakout": +0.3,
    "strong": +0.25, "outperform": +0.35, "revenue": +0.15,
    "bullish": +0.4, "recovery": +0.3, "expand": +0.2,
    # strongly negative
    "crash": -0.5, "plunge": -0.45, "fall": -0.3, "loss": -0.35,
    "miss": -0.35, "downgrade": -0.4, "sell": -0.2, "weak": -0.25,
    "concern": -0.2, "risk": -0.15, "decline": -0.3, "drop": -0.3,
    "bearish": -0.4, "cut": -0.2, "layoff": -0.35, "debt": -0.2,
    "fraud": -0.5, "probe": -0.3, "investigation": -0.3,
}

# RELIABILITY FIX #1: precompile word-boundary patterns instead of naive
# substring `in` checks. Prevents "risk" matching inside "brisk", "fall"
# matching inside "windfall", "cut" matching inside "execution", etc.
_BOOSTER_PATTERNS = {
    word: re.compile(r"\b" + re.escape(word) + r"\b")
    for word in FINANCIAL_BOOSTERS
}


def _fetch_headlines(symbol: str, company_name: str = "", max_articles: int = 15) -> list[str]:
    """Pull recent headlines from Google News RSS for the given symbol."""
    cache_key = f"news:{symbol}:{company_name}"
    cached = _cache_get(cache_key, CACHE_TTL_NEWS_SEC)
    if cached is not None:
        return cached

    queries = [symbol.replace(".NS", "").replace("^", "")]
    if company_name:
        queries.append(company_name)

    seen_titles = set()          # RELIABILITY FIX #3: de-dup across queries
    headlines = []

    # RELIABILITY FIX #6: bound the RSS fetch so a hung server can't
    # freeze the whole request. socket default timeout is what
    # feedparser's underlying urllib call respects.
    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(NETWORK_TIMEOUT_SEC)
    try:
        for q in queries:
            url = f"https://news.google.com/rss/search?q={q}+stock&hl=en-IN&gl=IN&ceid=IN:en"
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:max_articles]:
                    title = entry.get("title", "").strip()
                    if not title:
                        continue
                    norm = title.lower()
                    if norm in seen_titles:
                        continue
                    seen_titles.add(norm)
                    summary = entry.get("summary", "")
                    clean = re.sub(r"<[^>]+>", " ", summary)
                    headlines.append(title + " " + clean)
            except Exception as e:
                logger.warning(f"RSS fetch failed for {q}: {e}")
    finally:
        socket.setdefaulttimeout(old_timeout)

    headlines = headlines[:max_articles]
    _cache_set(cache_key, headlines)
    return headlines


def _score_headline(text: str) -> float:
    """
    Returns a sentiment score in [-1, +1].
    Combines TextBlob polarity with domain-specific financial booster words.
    """
    text_lower = text.lower()

    try:
        blob_score = TextBlob(text).sentiment.polarity
    except Exception:
        blob_score = 0.0

    booster = 0.0
    matches = 0
    for word, weight in FINANCIAL_BOOSTERS.items():
        if _BOOSTER_PATTERNS[word].search(text_lower):   # word-boundary match
            booster += weight
            matches += 1

    if matches > 0:
        booster = max(-1.0, min(1.0, booster / matches))
        return 0.40 * blob_score + 0.60 * booster
    return blob_score


def get_sentiment_score(symbol: str, company_name: str = "") -> dict:
    """
    Fetch news and return aggregated sentiment.
    Returns:
        score        : float in [-1, +1]
        label        : "Positive" | "Neutral" | "Negative"
        articles     : list of {headline, score}
        article_count: int
        reliability  : "high" | "low" | "none"  -- NEW, drives fusion weighting
    """
    try:
        headlines = _fetch_headlines(symbol, company_name)
    except Exception as e:
        logger.error(f"Sentiment pipeline failed for {symbol}: {e}")
        headlines = []

    if not headlines:
        return {
            "score": 0.0, "label": "Neutral", "articles": [],
            "article_count": 0, "reliability": "none",
        }

    scored = []
    for h in headlines:
        s = _score_headline(h)
        scored.append({"headline": h[:120], "score": round(s, 3)})

    scores = [a["score"] for a in scored]
    mean_score = float(np.mean(scores))

    if mean_score > 0.08:
        label = "Positive"
    elif mean_score < -0.08:
        label = "Negative"
    else:
        label = "Neutral"

    # RELIABILITY FIX #4: flag low-confidence sentiment when too few
    # articles back the score, so fusion can discount it accordingly.
    reliability = "high" if len(scored) >= MIN_ARTICLES_FOR_FULL_CONF else "low"

    return {
        "score": round(mean_score, 4),
        "label": label,
        "articles": scored[:8],
        "article_count": len(scored),
        "reliability": reliability,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2.  TECHNICAL INDICATORS  (pure pandas / numpy, no extra libs)
# ─────────────────────────────────────────────────────────────────────────────

def _ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def _safe_float(x) -> Optional[float]:
    """RELIABILITY FIX #2: turn NaN/inf into None instead of poisoning downstream logic."""
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    if x != x or x in (float("inf"), float("-inf")):   # NaN check without numpy import cost
        return None
    return x


def compute_indicators(df: pd.DataFrame) -> dict:
    """
    Compute RSI-14, MACD(12,26,9), EMA-9/21/50, Bollinger Bands(20),
    and a simple trend score from 50-day price change.
    All from the OHLCV DataFrame returned by yfinance.
    """
    close = df["Close"].dropna()

    if len(close) < 26:
        return {}   # not enough data

    # ── RSI 14 ───────────────────────────────────────────────────────────────
    delta  = close.diff()
    gain   = delta.clip(lower=0)
    loss   = (-delta).clip(lower=0)
    avg_g  = gain.ewm(alpha=1/14, adjust=False).mean()
    avg_l  = loss.ewm(alpha=1/14, adjust=False).mean()

    last_avg_g = float(avg_g.iloc[-1])
    last_avg_l = float(avg_l.iloc[-1])
    if last_avg_l == 0 and last_avg_g == 0:
        rsi = 50.0        # RELIABILITY FIX #2: flat price -> neutral, not NaN
    elif last_avg_l == 0:
        rsi = 100.0
    else:
        rs = last_avg_g / last_avg_l
        rsi = 100 - 100 / (1 + rs)

    # ── MACD (12, 26, 9) ────────────────────────────────────────────────────
    ema12  = _ema(close, 12)
    ema26  = _ema(close, 26)
    macd   = ema12 - ema26
    signal = _ema(macd, 9)
    macd_val   = float(macd.iloc[-1])
    signal_val = float(signal.iloc[-1])
    histogram  = macd_val - signal_val

    # ── EMAs ────────────────────────────────────────────────────────────────
    ema9  = float(_ema(close, 9).iloc[-1])
    ema21 = float(_ema(close, 21).iloc[-1])
    ema50 = float(_ema(close, 50).iloc[-1]) if len(close) >= 50 else None

    # ── Bollinger Bands (20, 2σ) ─────────────────────────────────────────────
    sma20  = close.rolling(20).mean().iloc[-1]
    std20  = close.rolling(20).std().iloc[-1]
    bb_upper = _safe_float(sma20 + 2 * std20)
    bb_lower = _safe_float(sma20 - 2 * std20)
    curr_price = float(close.iloc[-1])

    # ── 50-day trend ────────────────────────────────────────────────────────
    trend_50d = 0.0
    if len(close) >= 50 and float(close.iloc[-50]) != 0:
        trend_50d = (curr_price - float(close.iloc[-50])) / float(close.iloc[-50]) * 100

    return {
        "rsi": round(rsi, 2),
        "macd": round(macd_val, 4),
        "macd_signal": round(signal_val, 4),
        "macd_histogram": round(histogram, 4),
        "ema9": round(ema9, 2),
        "ema21": round(ema21, 2),
        "ema50": round(ema50, 2) if ema50 else None,
        "bb_upper": round(bb_upper, 2) if bb_upper is not None else None,
        "bb_lower": round(bb_lower, 2) if bb_lower is not None else None,
        "current_price": round(curr_price, 2),
        "trend_50d_pct": round(trend_50d, 2),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3.  TECHNICAL SIGNAL SCORER  →  float in [-1, +1]
# ─────────────────────────────────────────────────────────────────────────────

def score_technicals(ind: dict) -> tuple[float, list[str]]:
    """
    Convert indicator values to a single score in [-1, +1].
    Also returns human-readable reason strings.
    """
    if not ind:
        return 0.0, ["Insufficient price history"]

    score  = 0.0
    weight = 0.0
    reasons = []

    # ── RSI (weight 30%) ─────────────────────────────────────────────────────
    rsi = ind.get("rsi")
    if rsi is not None:
        if rsi < 30:
            r = +0.8
            reasons.append(f"RSI {rsi:.1f} — Oversold (bullish)")
        elif rsi < 45:
            r = +0.3
            reasons.append(f"RSI {rsi:.1f} — Approaching oversold")
        elif rsi > 70:
            r = -0.8
            reasons.append(f"RSI {rsi:.1f} — Overbought (bearish)")
        elif rsi > 55:
            r = -0.3
            reasons.append(f"RSI {rsi:.1f} — Approaching overbought")
        else:
            r = 0.0
            reasons.append(f"RSI {rsi:.1f} — Neutral zone")
        score  += 0.30 * r
        weight += 0.30

    # ── MACD crossover (weight 30%) ──────────────────────────────────────────
    macd = ind.get("macd")
    sig  = ind.get("macd_signal")
    hist = ind.get("macd_histogram")
    if macd is not None and sig is not None:
        if macd > sig and hist > 0:
            r = +0.7
            reasons.append(f"MACD {macd:.3f} above Signal {sig:.3f} — Bullish crossover")
        elif macd < sig and hist < 0:
            r = -0.7
            reasons.append(f"MACD {macd:.3f} below Signal {sig:.3f} — Bearish crossover")
        else:
            r = 0.0
            reasons.append(f"MACD near Signal — No clear crossover")
        score  += 0.30 * r
        weight += 0.30

    # ── EMA alignment (weight 25%) ───────────────────────────────────────────
    cp   = ind.get("current_price", 0)
    ema9 = ind.get("ema9")
    ema21= ind.get("ema21")
    ema50= ind.get("ema50")
    if ema9 and ema21 and cp:
        if cp > ema9 > ema21:
            r = +0.6
            reasons.append(f"Price {cp:.2f} > EMA9 > EMA21 — Strong uptrend")
        elif cp < ema9 < ema21:
            r = -0.6
            reasons.append(f"Price {cp:.2f} < EMA9 < EMA21 — Strong downtrend")
        elif cp > ema21:
            r = +0.2
            reasons.append(f"Price above EMA21 — Mild bullish bias")
        else:
            r = -0.2
            reasons.append(f"Price below EMA21 — Mild bearish bias")
        if ema50:
            if cp > ema50:
                r += 0.15
                reasons.append(f"Price above EMA50 — Long-term bullish")
            else:
                r -= 0.15
                reasons.append(f"Price below EMA50 — Long-term bearish")
        r = max(-1.0, min(1.0, r))
        score  += 0.25 * r
        weight += 0.25

    # ── Bollinger Band position (weight 15%) ─────────────────────────────────
    bbu = ind.get("bb_upper")
    bbl = ind.get("bb_lower")
    if bbu and bbl and cp:
        band_range = bbu - bbl
        if band_range > 0:
            pos = (cp - bbl) / band_range
            if pos < 0.15:
                r = +0.7
                reasons.append(f"Price near lower Bollinger Band — Oversold zone")
            elif pos > 0.85:
                r = -0.7
                reasons.append(f"Price near upper Bollinger Band — Overbought zone")
            else:
                r = (pos - 0.5) * -0.4
                reasons.append(f"Price in mid Bollinger Band ({pos*100:.0f}% of range)")
            score  += 0.15 * r
            weight += 0.15

    if weight > 0:
        score = score / weight * 1.0
    return round(max(-1.0, min(1.0, score)), 4), reasons


# ─────────────────────────────────────────────────────────────────────────────
# 4.  50-DAY TREND SCORER  →  float in [-1, +1]
# ─────────────────────────────────────────────────────────────────────────────

def score_trend(trend_50d: Optional[float]) -> float:
    if trend_50d is None:
        return 0.0
    return round(max(-1.0, min(1.0, trend_50d / 20.0)), 4)


# ─────────────────────────────────────────────────────────────────────────────
# 5.  COMPOSITE SIGNAL ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def _fetch_price_history(norm_symbol: str) -> pd.DataFrame:
    """RELIABILITY FIX #6/#7: timeout-bounded, cached OHLCV fetch."""
    cache_key = f"price:{norm_symbol}"
    cached = _cache_get(cache_key, CACHE_TTL_PRICE_SEC)
    if cached is not None:
        return cached

    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(NETWORK_TIMEOUT_SEC)
    try:
        stock = yf.Ticker(norm_symbol)
        df = stock.history(period="3mo")
    finally:
        socket.setdefaulttimeout(old_timeout)

    _cache_set(cache_key, df)
    return df


def get_signal(symbol: str, company_name: str = "") -> dict:
    """
    Main entry point. Returns a full signal object ready to send to the frontend.

    Usage in data_app.py:
        from signal_engine import get_signal

        @app.get("/signal/{symbol}")
        def signal_endpoint(symbol: str, company: str = ""):
            return get_signal(symbol, company)
    """
    norm_symbol = _normalize(symbol)

    # ── Step 1: Fetch OHLCV history ──────────────────────────────────────────
    try:
        df = _fetch_price_history(norm_symbol)
        if df.empty:
            return _error_response("No price data found for " + symbol)
        current_price = float(df["Close"].iloc[-1])
        volume        = int(df["Volume"].iloc[-1])
    except Exception as e:
        logger.error(f"Price fetch failed for {symbol}: {e}")
        return _error_response(str(e))

    # ── Step 2: Technical indicators ─────────────────────────────────────────
    # RELIABILITY FIX #8: isolate this stage so a bad indicator calc degrades
    # to "no technical signal" instead of crashing the whole request.
    try:
        indicators  = compute_indicators(df)
        tech_score, tech_reasons = score_technicals(indicators)
        trend_score = score_trend(indicators.get("trend_50d_pct"))
        tech_available = bool(indicators)
    except Exception as e:
        logger.error(f"Indicator computation failed for {symbol}: {e}")
        indicators, tech_score, trend_score = {}, 0.0, 0.0
        tech_reasons = ["Technical indicators unavailable due to a data error"]
        tech_available = False

    # ── Step 3: News sentiment ────────────────────────────────────────────────
    try:
        sentiment = get_sentiment_score(symbol, company_name)
    except Exception as e:
        logger.error(f"Sentiment stage failed for {symbol}: {e}")
        sentiment = {"score": 0.0, "label": "Neutral", "articles": [],
                     "article_count": 0, "reliability": "none"}
    sent_score = sentiment["score"]

    # ── Step 4: Dynamic weighted fusion ───────────────────────────────────────
    # RELIABILITY FIX #5: instead of always applying fixed 35/35/30 weights
    # (which silently drags the composite toward 0 whenever news is empty),
    # only distribute weight across components that are actually trustworthy,
    # then renormalize so the weights still sum to 1.
    components = []
    if tech_available:
        components.append(("technical", tech_score, W_TECH))
    if sentiment["reliability"] == "high":
        components.append(("sentiment", sent_score, W_SENT))
    elif sentiment["reliability"] == "low":
        components.append(("sentiment", sent_score, W_SENT * 0.5))  # discounted, not dropped
    # trend is always included when we have price data (already guaranteed by Step 1)
    components.append(("trend", trend_score, W_TRND))

    total_weight = sum(w for _, _, w in components)
    if total_weight > 0:
        composite = sum(s * w for _, s, w in components) / total_weight
    else:
        composite = 0.0
    composite = round(max(-1.0, min(1.0, composite)), 4)

    # ── Step 5: Threshold → Signal ───────────────────────────────────────────
    if composite >= BUY_THRESHOLD:
        signal   = "BUY"
        strength = "Strong" if composite >= STRONG_THRESHOLD else "Moderate"
        action   = (
            f"Indicators suggest a {strength.lower()} buying opportunity. "
            f"Consider entering a long position with a stop-loss below the recent swing low."
        )
    elif composite <= SELL_THRESHOLD:
        signal   = "SELL"
        strength = "Strong" if composite <= -STRONG_THRESHOLD else "Moderate"
        action   = (
            f"Indicators suggest {strength.lower()} selling pressure. "
            f"Consider reducing exposure or setting a tight stop-loss."
        )
    else:
        signal   = "HOLD"
        strength = "Neutral"
        action   = (
            "Mixed signals — no clear directional edge. "
            "Wait for a stronger confluence before entering a new position."
        )

    # Confidence: composite strength, discounted when fewer components/evidence
    # backed it (RELIABILITY FIX #4/#5 tie-in).
    base_confidence = 50 + abs(composite) * 50
    evidence_ratio = total_weight / (W_TECH + W_SENT + W_TRND)  # 1.0 = full evidence available
    confidence = round(50 + (base_confidence - 50) * evidence_ratio, 1)

    sent_reason = (
        f"News sentiment: {sentiment['label']} "
        f"(score {sentiment['score']:+.3f}, {sentiment['article_count']} articles, "
        f"{sentiment['reliability']} reliability)"
    )
    trend_reason = (
        f"50-day trend: {indicators.get('trend_50d_pct', 0):+.1f}% "
        f"({'bullish' if trend_score > 0 else 'bearish' if trend_score < 0 else 'flat'})"
    )

    return {
        # ── Core signal ──────────────────────────────────────────────────────
        "symbol":        symbol,
        "signal":        signal,
        "strength":      strength,
        "composite_score": composite,
        "confidence_pct":  confidence,
        "action_text":   action,

        # ── Component scores ─────────────────────────────────────────────────
        "scores": {
            "technical":  round(tech_score, 4),
            "sentiment":  round(sent_score, 4),
            "trend":      round(trend_score, 4),
        },
        "components_used": [c[0] for c in components],   # NEW: transparency on what fed the composite

        # ── Reasons / explanations ───────────────────────────────────────────
        "reasons": tech_reasons + [sent_reason, trend_reason],

        # ── Technical indicator values (for dashboard display) ────────────────
        "indicators": indicators,

        # ── Sentiment detail ─────────────────────────────────────────────────
        "sentiment": {
            "score":    sentiment["score"],
            "label":    sentiment["label"],
            "articles": sentiment["articles"],
            "reliability": sentiment["reliability"],
        },

        # ── Price snapshot ────────────────────────────────────────────────────
        "price":  current_price,
        "volume": volume,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6.  HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _normalize(symbol: str) -> str:
    """Mirror the normalize_symbol logic from data_app.py."""
    symbol = symbol.strip().upper()
    mapping = {
        "MAHINDRA & MAHINDRA": "M&M.NS", "M&M": "M&M.NS",
        "NIFTY 50": "^NSEI", "SENSEX": "^BSESN"
    }
    if symbol in mapping:
        return mapping[symbol]
    if symbol.endswith(".NS") or symbol.startswith("^"):
        return symbol
    us_stocks = {"AAPL","GOOGL","MSFT","AMZN","META","NVDA","TSLA","NFLX"}
    if symbol in us_stocks:
        return symbol
    return symbol + ".NS"

def _error_response(msg: str) -> dict:
    return {
        "symbol": "", "signal": "HOLD", "strength": "Neutral",
        "composite_score": 0.0, "confidence_pct": 50.0,
        "action_text": "Could not compute signal: " + msg,
        "scores": {"technical": 0.0, "sentiment": 0.0, "trend": 0.0},
        "components_used": [],
        "reasons": [msg], "indicators": {}, "sentiment": {},
        "price": 0.0, "volume": 0, "timestamp": datetime.now(timezone.utc).isoformat(),
        "error": msg,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 7.  HOW TO PLUG INTO data_app.py  (copy-paste these 4 lines)
# ─────────────────────────────────────────────────────────────────────────────
"""
# ── ADD TO TOP OF data_app.py ──────────────────────────────────────────────
from signal_engine import get_signal

# ── ADD THIS ROUTE TO data_app.py ──────────────────────────────────────────
@app.get("/signal/{symbol}")
def signal_endpoint(symbol: str, company: str = ""):
    \"\"\"
    Returns composite Buy/Sell/Hold signal.
    Example: GET /signal/INFY?company=Infosys
    \"\"\"
    return get_signal(symbol, company)
"""

# ─────────────────────────────────────────────────────────────────────────────
# 8.  STANDALONE TEST  (run: python signal_engine.py)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json
    print("Testing signal engine on INFY...\n")
    result = get_signal("INFY", "Infosys")
    result["sentiment"]["articles"] = f"[{len(result['sentiment'].get('articles',[]))} articles]"
    print(json.dumps(result, indent=2))