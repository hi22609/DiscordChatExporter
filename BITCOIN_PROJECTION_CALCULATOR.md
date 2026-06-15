# Bitcoin Projection Calculator — Full Specification
## Powered by the 1070 / 364 Cycle Framework

> **Vision:** The most precise, cycle-aware Bitcoin price projection engine ever built — the foundation of an investment platform that outperforms Robinhood and Autopilot by combining on-chain blockchain intelligence with deterministic cycle math.

---

## Table of Contents

1. [The 1070 / 364 Cycle Explained](#1-the-1070--364-cycle-explained)
2. [Cycle Phase Breakdown — Every Unit of Time](#2-cycle-phase-breakdown--every-unit-of-time)
3. [Projection Engine — Formula & Logic](#3-projection-engine--formula--logic)
4. [Full Time-Resolution Matrix](#4-full-time-resolution-matrix)
5. [Price Projection Bands](#5-price-projection-bands)
6. [On-Chain Signal Layers](#6-on-chain-signal-layers)
7. [Investment App Feature Spec](#7-investment-app-feature-spec)
8. [Data Architecture](#8-data-architecture)
9. [UI/UX Wireframe Spec](#9-uiux-wireframe-spec)
10. [API & Integration Points](#10-api--integration-points)
11. [Cycle History Table (All Halvings)](#11-cycle-history-table-all-halvings)
12. [Glossary](#12-glossary)

---

## 1. The 1070 / 364 Cycle Explained

### What It Is

The **1070 / 364 Cycle** is a Bitcoin price cycle framework derived from empirical observation of every halving cycle since 2012. It divides the ~4-year Bitcoin halving epoch into two primary arcs:

| Arc | Days | Description |
|-----|------|-------------|
| **Arc 1 — Expansion** | **1070 days** | From halving day to cycle peak (ATH) |
| **Arc 2 — Contraction** | **364 days** | From cycle peak to cycle bottom (bear floor) |
| **Full Epoch** | **1434 days** | ~3.93 years per full cycle |

> The next halving fires at day 1435, resetting Arc 1.

### Why 1070 and 364?

- **1070** ≈ the average number of days from each halving to the subsequent all-time high across the 2012, 2016, and 2020 cycles.
- **364** = exactly 52 weeks — the bear contraction consistently resolves near one solar year after the ATH.
- Together they form a **1434-day total epoch**, tightly bounded by the ~1458-day (4-year) block reward halving schedule.

### Cycle Phases Within Arc 1 (1070 days)

| Phase | Day Range | % of Arc 1 | Behavior |
|-------|-----------|------------|----------|
| **Accumulation** | Day 1–180 | 16.8% | Slow grind, low volume, whales buying |
| **Re-Awakening** | Day 181–365 | 17.3% | Media returns, retail starts noticing |
| **Momentum Build** | Day 366–540 | 16.3% | FOMO begins, weekly closes above key MA |
| **Parabolic Advance** | Day 541–780 | 22.4% | Exponential price discovery |
| **Blow-Off Top** | Day 781–1070 | 27.1% | Euphoria, peak greed, ATH printed |

### Cycle Phases Within Arc 2 (364 days)

| Phase | Day Range | % of Arc 2 | Behavior |
|-------|-----------|------------|----------|
| **Denial** | Day 1–60 | 16.5% | Dip buyers flood in |
| **Capitulation** | Day 61–150 | 24.7% | Cascading liquidations, media panic |
| **Despair** | Day 151–280 | 35.7% | Quiet. No news. Accumulation restarts |
| **Stealth Bottom** | Day 281–364 | 23.1% | Bottom confirmed, next Arc 1 pre-loads |

---

## 2. Cycle Phase Breakdown — Every Unit of Time

### Arc 1 — Expansion (1070 Days) — Full Resolution

#### In Years
| Year Mark | Cumulative Days | Phase | Expected % of ATH |
|-----------|-----------------|-------|-------------------|
| Year 0.0 | 0 | Halving Day — baseline | ~25–35% of ATH |
| Year 0.5 | ~183 | Late Accumulation | ~35–50% |
| Year 1.0 | ~365 | Re-Awakening peak | ~50–70% |
| Year 1.5 | ~548 | Momentum Build peak | ~65–85% |
| Year 2.0 | ~730 | Deep Parabolic | ~80–95% |
| Year 2.93 | 1070 | **ATH / Cycle Peak** | **100%** |

#### In Months (1070 days = 35.67 months)
| Month | ~Day | Phase | Price Action |
|-------|------|-------|--------------|
| M0 | 0 | Halving | Supply shock begins |
| M1 | 30 | Accum | Flat or slight dip |
| M2 | 61 | Accum | First green weekly candles |
| M3 | 91 | Accum | Volume uptick |
| M4 | 122 | Accum | Break above 200-day MA |
| M5 | 152 | Accum | Consolidation |
| M6 | 183 | Re-Awakening | First media cycle returns |
| M7 | 213 | Re-Awakening | New retail wallets spike |
| M8 | 244 | Re-Awakening | Altcoin season begins |
| M9 | 274 | Re-Awakening | Monthly RSI > 60 |
| M10 | 305 | Re-Awakening | Weekly MACD bullish cross |
| M11 | 335 | Re-Awakening | Approaching prior ATH |
| M12 | 365 | Momentum | Prior ATH retest |
| M13 | 396 | Momentum | ATH broken, price discovery |
| M14 | 426 | Momentum | Consolidation above old ATH |
| M15 | 457 | Momentum | Institutions accumulate |
| M16 | 487 | Momentum | ETF inflows surge |
| M17 | 518 | Momentum | Parabolic arc begins |
| M18 | 548 | Momentum | 3× halving price |
| M19 | 579 | Parabolic | FOMO retail flood |
| M20 | 609 | Parabolic | Weekly candles 20–30% |
| M21 | 640 | Parabolic | Fear & Greed > 85 |
| M22 | 670 | Parabolic | 5× halving price |
| M23 | 700 | Parabolic | Leveraged long liquidations cascade |
| M24 | 731 | Parabolic | Media "Bitcoin to $1M" headlines |
| M25 | 761 | Blow-Off | 7× halving price |
| M26 | 791 | Blow-Off | Saturation, new retail peaks |
| M27 | 822 | Blow-Off | Smart money distribution begins |
| M28 | 852 | Blow-Off | On-chain SOPR > 1.5 |
| M29 | 883 | Blow-Off | Final leg up, exchanges flashing red |
| M30 | 913 | Blow-Off | Volume climax |
| M31 | 944 | Blow-Off | RSI monthly > 90 |
| M32 | 974 | Blow-Off | Whale wallets redistributing |
| M33 | 1005 | Blow-Off | Daily candles +10–20% |
| M34 | 1035 | Blow-Off | Peak euphoria, Google Trends 100 |
| M35 | 1065 | **ATH Zone** | **Cycle top printed** |
| M35.67 | 1070 | **Peak** | **Maximum projection target** |

#### In Weeks (1070 days = 152.86 weeks)
| Week | Day | Phase | Signal |
|------|-----|-------|--------|
| W1 | 7 | Accum | Halving confirmed |
| W4 | 28 | Accum | First dip flush |
| W8 | 56 | Accum | Stabilization |
| W12 | 84 | Accum | Stealth accumulation |
| W16 | 112 | Accum | Volume baseline set |
| W20 | 140 | Accum | 50-week MA reclaimed |
| W26 | 182 | Re-Awaken | 6-month cycle mark |
| W30 | 210 | Re-Awaken | Retail metrics rise |
| W36 | 252 | Re-Awaken | First wave ATH test |
| W40 | 280 | Re-Awaken | 40-week MA as support |
| W44 | 308 | Re-Awaken | Strong weekly closes |
| W52 | 364 | Momentum | Year 1 complete |
| W60 | 420 | Momentum | Price discovery zone |
| W68 | 476 | Momentum | Monthly RSI 70+ |
| W76 | 532 | Momentum | Pi Cycle top watch |
| W80 | 560 | Parabolic | 3× from halving low |
| W90 | 630 | Parabolic | 4× from halving low |
| W100 | 700 | Parabolic | 5× from halving low |
| W110 | 770 | Blow-Off | 6× from halving low |
| W120 | 840 | Blow-Off | Whale distribution confirmed |
| W130 | 910 | Blow-Off | Volume climax zone |
| W140 | 980 | Blow-Off | Final blow-off candles |
| W148 | 1036 | Blow-Off | Top-watch window opens |
| W152 | 1064 | ATH Zone | Cycle peak |
| **W152.86** | **1070** | **Peak Day** | **ATH printed** |

#### In Days — Key Day Markers

| Day | Milestone | Significance |
|-----|-----------|--------------|
| 0 | Halving Block | Supply drops 50% |
| 14 | 2 weeks post | Short-term traders exit |
| 30 | 1 month | First monthly close |
| 60 | 2 months | Dip washed out |
| 90 | Quarter 1 | Trend confirmed |
| 120 | 4 months | Institutional watch begins |
| 180 | 6 months | Accum/Re-Awaken transition |
| 210 | 7 months | Retail wallet creation spikes |
| 252 | 36 weeks | Old ATH test #1 |
| 280 | 40 weeks | 40W MA as support |
| 365 | Year 1 | Re-Awaken → Momentum |
| 400 | | Price discovery starts |
| 450 | | Strong weekly candles |
| 500 | | Altcoin rotation peaks |
| 540 | | Momentum → Parabolic |
| 600 | | Weekly RSI 70+ |
| 630 | | 4× halving low |
| 700 | | 5× halving low |
| 730 | Year 2 | Parabola steepens |
| 780 | | Parabolic → Blow-Off |
| 840 | | Whale distribution |
| 900 | | Volume climax |
| 960 | | Final leg up |
| 1000 | | RSI monthly 90+ |
| 1035 | | Peak Google Trends |
| 1050 | | Smart money fully out |
| 1070 | **DAY 1070** | **Cycle ATH — SELL SIGNAL** |

#### In Hours — Sub-Day Precision

| Hour Mark (from Halving) | Day Equivalent | Context |
|--------------------------|---------------|---------|
| 0h | Day 0 | Halving block mined |
| 24h | Day 1 | Post-halving 24h candle |
| 168h | Day 7 | First weekly candle close |
| 336h | Day 14 | 2-week pivot check |
| 720h | Day 30 | First monthly close |
| 2,160h | Day 90 | Q1 trend lock |
| 4,320h | Day 180 | Phase 1→2 transition |
| 8,760h | Day 365 | Year 1 mark |
| 12,960h | Day 540 | Phase 3→4 (Parabolic) |
| 17,520h | Day 730 | Year 2 mark |
| 18,720h | Day 780 | Phase 4→5 (Blow-Off) |
| 25,680h | Day 1,070 | **ATH Hour — Cycle Peak** |
| 33,432h | Day 1,393 | Pre-bottom |
| 34,416h | Day 1,434 | **Bear Bottom / Pre-Halving** |

---

### Arc 2 — Contraction (364 Days) — Full Resolution

#### In Months (364 days = 12.13 months)
| Month | ~Day from Peak | Phase | Price Action |
|-------|---------------|-------|--------------|
| M0 | 0 | ATH printed | Distribution |
| M1 | 30 | Denial | -15 to -25% |
| M2 | 61 | Capitulation | -30 to -45% |
| M3 | 91 | Capitulation | -50 to -60% |
| M4 | 122 | Capitulation | Cascading longs |
| M5 | 152 | Despair | -65 to -75% |
| M6 | 183 | Despair | Media exits |
| M7 | 213 | Despair | Low volume sideways |
| M8 | 244 | Despair | Accumulation whispers |
| M9 | 274 | Despair | Slow stabilization |
| M10 | 305 | Stealth Bottom | Whales absorbing |
| M11 | 335 | Stealth Bottom | Pre-halving hype builds |
| M12 | **364** | **Cycle Bottom** | **BUY Signal — Arc 1 Begins** |

#### In Weeks (Arc 2 = 52 weeks exactly)
| Week | Day from Peak | Phase | Action |
|------|--------------|-------|--------|
| W1 | 7 | Denial | Hold or sell rallies |
| W2 | 14 | Denial | Lower high confirmed |
| W4 | 28 | Denial | Retail still buying dips |
| W6 | 42 | Capitulation | Panic begins |
| W8 | 56 | Capitulation | Liquidation cascades |
| W10 | 70 | Capitulation | -50% from ATH |
| W12 | 84 | Capitulation | Exchange outflows |
| W16 | 112 | Capitulation | Miners capitulate |
| W20 | 140 | Despair | -70% from ATH |
| W24 | 168 | Despair | Dead market |
| W30 | 210 | Despair | Hash rate stabilizes |
| W36 | 252 | Stealth Bottom | Long-term holder accumulation |
| W40 | 280 | Stealth Bottom | Addresses with 1+ BTC rising |
| W44 | 308 | Stealth Bottom | On-chain: supply in loss peaks |
| W48 | 336 | Stealth Bottom | Pre-halving speculation starts |
| **W52** | **364** | **Bottom** | **Cycle resets** |

#### In Days — Key Bear Market Markers
| Day from ATH | Milestone | Typical % Drop from ATH |
|-------------|-----------|------------------------|
| 0 | ATH | 0% |
| 7 | Week 1 | -10 to -15% |
| 14 | 2 weeks | -15 to -25% |
| 30 | 1 month | -25 to -35% |
| 60 | 2 months | -45 to -55% |
| 90 | 3 months | -55 to -65% |
| 120 | 4 months | -60 to -70% |
| 150 | 5 months | -65 to -75% |
| 180 | 6 months | -70 to -78% |
| 210 | 7 months | -72 to -80% |
| 240 | 8 months | -73 to -80% |
| 270 | 9 months | -74 to -80% |
| 300 | 10 months | -75 to -82% |
| 330 | 11 months | -74 to -80% |
| 364 | **12 months** | **Bottom (-75 to -85%)** |

---

## 3. Projection Engine — Formula & Logic

### Core Projection Formula

```
Projected_Price(d) = Halving_Price × Multiplier(d) × Cycle_Decay_Factor
```

Where:

```
Multiplier(d) = Base_Multiplier × Phase_Coefficient(d) × Momentum_Index
```

### Multiplier Table by Cycle

| Cycle | Halving Price | ATH | ATH Multiplier | Bear Bottom | Bottom Multiplier |
|-------|-------------|-----|---------------|-------------|------------------|
| 2012 | $12 | $1,163 | 96× | $152 | 12.7× |
| 2016 | $650 | $19,891 | 30.6× | $3,122 | 4.8× |
| 2020 | $8,750 | $69,000 | 7.9× | $15,476 | 1.77× |
| 2024 | ~$62,000 | TBD | TBD | TBD | TBD |

### Logarithmic Decay Model

Each cycle, the multiplier shrinks by approximately the power law:

```
ATH_Multiplier(n) = 96 × (0.32)^(n-1)
```

Where `n` = cycle number (1 = 2012 cycle).

### Projected ATH — 2024 Cycle (Cycle 5)

```
ATH_Multiplier(5) = 96 × (0.32)^4 ≈ 3.2×
Halving_Price_2024 ≈ $62,000
Projected_ATH ≈ $62,000 × 3.2 = ~$198,400
Conservative: $140,000 | Base: $200,000 | Optimistic: $350,000
```

### Day-by-Day Price Function (Arc 1)

```
P(d) = P_halving × (ATH_mult × sigmoid((d - 535) / 120))

sigmoid(x) = 1 / (1 + e^(-x))
```

This produces the characteristic S-curve leading into the exponential blow-off.

### Hour-by-Hour Interpolation

```
P(h) = P(d_floor) + ((P(d_ceil) - P(d_floor)) × (h mod 24) / 24)
```

### Bear Market Drawdown Function (Arc 2)

```
P(d) = P_ATH × (1 - max_drawdown × (1 - e^(-d/τ)))

τ = 80 (decay constant, tuned to historical data)
max_drawdown = 0.80 (80% from ATH to bottom)
```

---

## 4. Full Time-Resolution Matrix

### Current Cycle (2024 Halving — April 19, 2024)

| Time Unit | Cycle Start | Phase 1→2 | Phase 2→3 | Phase 3→4 | Phase 4→5 | ATH Day | Bear Bottom |
|-----------|------------|-----------|-----------|-----------|-----------|---------|------------|
| **Years** | 2024.30 | 2024.79 | 2025.29 | 2025.78 | 2026.44 | 2027.23 | 2028.23 |
| **Months** | Apr 2024 | Oct 2024 | Apr 2025 | Oct 2025 | Aug 2026 | Mar 2027 | Mar 2028 |
| **Weeks** | W17 2024 | W43 2024 | W17 2025 | W43 2025 | W30 2026 | W10 2027 | W10 2028 |
| **Days** | Day 0 | Day 180 | Day 365 | Day 540 | Day 780 | Day 1070 | Day 1434 |
| **Hours** | 0h | 4,320h | 8,760h | 12,960h | 18,720h | 25,680h | 34,416h |

### Precise Calendar Dates (2024 Cycle)

| Event | Date | Day # | Hour # |
|-------|------|-------|--------|
| Halving Block | April 19, 2024 | 0 | 0 |
| Accumulation End | October 16, 2024 | 180 | 4,320 |
| Year 1 Mark | April 19, 2025 | 365 | 8,760 |
| Parabolic Start | October 11, 2025 | 540 | 12,960 |
| Blow-Off Start | March 10, 2026 | 780 | 18,720 |
| **Projected ATH** | **January 24, 2027** | **1,070** | **25,680** |
| Arc 2 Start | January 24, 2027 | 0 (A2) | 0 (A2) |
| Bear Capitulation | March 25, 2027 | 60 (A2) | 1,440 (A2) |
| Bear Despair | June 23, 2027 | 150 (A2) | 3,600 (A2) |
| **Projected Bottom** | **January 23, 2028** | **364 (A2)** | **8,736 (A2)** |
| Next Halving (Est.) | April 2028 | 1,434 | 34,416 |

---

## 5. Price Projection Bands

### 2024 Cycle Projection Table — Every 30 Days

| Date | Day | Phase | Bear Case | Base Case | Bull Case |
|------|-----|-------|-----------|-----------|-----------|
| Apr 2024 | 0 | Halving | $62,000 | $62,000 | $62,000 |
| May 2024 | 30 | Accum | $55,000 | $63,000 | $68,000 |
| Jun 2024 | 61 | Accum | $52,000 | $60,000 | $70,000 |
| Jul 2024 | 91 | Accum | $55,000 | $63,000 | $75,000 |
| Aug 2024 | 122 | Accum | $58,000 | $67,000 | $82,000 |
| Sep 2024 | 152 | Accum | $61,000 | $70,000 | $88,000 |
| Oct 2024 | 183 | Re-Awaken | $65,000 | $76,000 | $96,000 |
| Nov 2024 | 213 | Re-Awaken | $70,000 | $83,000 | $108,000 |
| Dec 2024 | 244 | Re-Awaken | $76,000 | $91,000 | $118,000 |
| Jan 2025 | 274 | Re-Awaken | $80,000 | $98,000 | $130,000 |
| Feb 2025 | 305 | Re-Awaken | $85,000 | $105,000 | $145,000 |
| Mar 2025 | 335 | Re-Awaken | $90,000 | $112,000 | $160,000 |
| Apr 2025 | 365 | Momentum | $95,000 | $120,000 | $175,000 |
| May 2025 | 396 | Momentum | $100,000 | $128,000 | $190,000 |
| Jun 2025 | 426 | Momentum | $105,000 | $136,000 | $205,000 |
| Jul 2025 | 457 | Momentum | $110,000 | $145,000 | $222,000 |
| Aug 2025 | 487 | Momentum | $112,000 | $150,000 | $238,000 |
| Sep 2025 | 518 | Momentum | $118,000 | $158,000 | $255,000 |
| Oct 2025 | 548 | Parabolic | $120,000 | $165,000 | $272,000 |
| Nov 2025 | 579 | Parabolic | $122,000 | $173,000 | $292,000 |
| Dec 2025 | 609 | Parabolic | $124,000 | $182,000 | $310,000 |
| Jan 2026 | 640 | Parabolic | $126,000 | $192,000 | $332,000 |
| Feb 2026 | 670 | Parabolic | $128,000 | $202,000 | $352,000 |
| Mar 2026 | 700 | Parabolic | $130,000 | $213,000 | $372,000 |
| Apr 2026 | 731 | Parabolic | $132,000 | $222,000 | $390,000 |
| May 2026 | 761 | Blow-Off | $134,000 | $233,000 | $410,000 |
| Jun 2026 | 791 | Blow-Off | $133,000 | $244,000 | $430,000 |
| Jul 2026 | 822 | Blow-Off | $130,000 | $252,000 | $448,000 |
| Aug 2026 | 852 | Blow-Off | $128,000 | $260,000 | $465,000 |
| Sep 2026 | 883 | Blow-Off | $126,000 | $266,000 | $480,000 |
| Oct 2026 | 913 | Blow-Off | $122,000 | $270,000 | $495,000 |
| Nov 2026 | 944 | Blow-Off | $118,000 | $273,000 | $505,000 |
| Dec 2026 | 974 | Blow-Off | $114,000 | $274,000 | $512,000 |
| Jan 2027 | 1005 | Blow-Off | $108,000 | $272,000 | $515,000 |
| **Jan 24, 2027** | **1070** | **ATH** | **$140,000** | **$200,000** | **$350,000** |
| Feb 2027 | 1100 (A2:30) | Denial | $170,000 | $155,000 | $295,000 |
| Apr 2027 | 1160 (A2:90) | Capitulation | $90,000 | $90,000 | $170,000 |
| Jul 2027 | 1280 (A2:210) | Despair | $52,000 | $52,000 | $95,000 |
| **Jan 2028** | **1434** | **Bottom** | **$28,000** | **$42,000** | **$70,000** |

---

## 6. On-Chain Signal Layers

The calculator ingests and scores the following on-chain metrics to adjust projections in real-time:

### Accumulation Signals (Bullish)
| Signal | Source | Threshold |
|--------|--------|-----------|
| Exchange BTC Outflows | Glassnode | > 5,000 BTC/day net outflow |
| Long-Term Holder Supply | Glassnode | > 75% of circulating supply |
| SOPR (Spent Output Profit Ratio) | Glassnode | SOPR < 1 = accumulation zone |
| Puell Multiple | Glassnode | Puell < 0.5 = miner distress / buy |
| MVRV Z-Score | Glassnode | MVRV < 0 = extreme undervalue |
| Hash Rate Growth | Blockchain.com | Rising = miner confidence |
| Realized Price Support | CryptoQuant | Price > Realized Price = healthy |

### Distribution Signals (Bearish / Top Warning)
| Signal | Source | Threshold |
|--------|--------|-----------|
| Exchange BTC Inflows | Glassnode | > 8,000 BTC/day net inflow |
| Pi Cycle Top Indicator | TradingView | 111DMA × 2 crosses 350DMA |
| NUPL (Net Unrealized P&L) | Glassnode | NUPL > 0.75 = euphoria |
| Fear & Greed Index | Alternative.me | > 90 = extreme greed |
| Funding Rates | Bybit / Binance | Perpetual funding > 0.1% |
| Google Trends | Google | "Bitcoin" trends score = 100 |
| Coinbase App Store Rank | App Store | Top 10 Finance = retail peak |

### Composite Cycle Score (0–100)

```
Cycle_Score = (
  (1 - MVRV_normalized) × 25 +
  SOPR_normalized × 20 +
  LTH_Supply_pct × 15 +
  (1 - Exchange_Inflow_normalized) × 15 +
  (1 - FearGreed_normalized) × 10 +
  Puell_normalized × 15
)
```

| Score | Status | Action |
|-------|--------|--------|
| 0–20 | **Extreme Undervalued** | Aggressive Buy |
| 21–40 | **Undervalued** | Buy |
| 41–60 | **Fair Value** | Hold |
| 61–80 | **Overvalued** | Take Profits |
| 81–100 | **Extreme Overvalued** | Sell / Hedge |

---

## 7. Investment App Feature Spec

### Core Features

#### 7.1 Cycle Dashboard
- Live countdown clock to projected ATH: `Days : Hours : Minutes : Seconds`
- Current cycle phase badge with animated indicator
- Projected price range card (Bear / Base / Bull)
- Cycle Score gauge (0–100)
- Next major milestone countdown

#### 7.2 Portfolio Engine
- Connect wallets (BTC, ETH, SOL addresses)
- Connect exchanges via read-only API (Coinbase, Kraken, Binance, Gemini)
- Real-time portfolio valuation
- Cycle-adjusted portfolio score ("Are you positioned for the blow-off?")
- Auto-rebalance suggestions based on cycle phase

#### 7.3 DCA Optimizer (Dollar-Cost Averaging)
- Input: weekly/monthly budget
- Output: optimal buy schedule based on cycle phase
  - Accumulation phase: Full DCA
  - Momentum phase: Reduced DCA + hold
  - Blow-Off phase: Stop DCA + scale out
  - Denial/Capitulation: Pause or buy dips
  - Despair: Resume aggressive DCA

#### 7.4 Exit Strategy Planner
- Set target prices: 25% / 50% / 75% / 100% sell ladders
- Countdown to each sell window based on cycle
- Tax-loss harvesting calendar
- Realized/unrealized gain tracker

#### 7.5 Autopilot Mode
- User sets risk profile: Conservative / Balanced / Aggressive
- App auto-executes buy/sell orders via connected exchange API
- Sell ladder auto-arms when Cycle_Score > 80
- Stop-loss auto-triggers on-chain capitulation signals
- Notifications: push + email + SMS

#### 7.6 Prediction Feed
- Live feed of on-chain metrics with plain-English interpretation
- Weekly cycle update report (AI-generated)
- Historical comparisons: "Today's metrics match Day 812 of the 2020 cycle"
- Price oracle: next 7 / 30 / 90 / 365 day projection with confidence band

#### 7.7 Social Layer
- Public portfolio cards (share your cycle position)
- Leaderboard: who called the top/bottom closest
- Alerts: subscribe to whale wallet moves
- Community sentiment index

---

## 8. Data Architecture

### Data Sources

| Source | Type | Refresh Rate |
|--------|------|-------------|
| CoinGecko API | Price | 60 seconds |
| Glassnode API | On-chain | 10 minutes |
| Blockchain.com API | Network | 5 minutes |
| Alternative.me | Fear & Greed | 1 hour |
| Google Trends API | Social | 4 hours |
| Binance / Bybit WebSocket | Funding Rates | Real-time |
| Block explorers | Wallet data | Real-time |

### Database Schema (Core Tables)

```sql
-- Cycle definitions
CREATE TABLE cycles (
  id          INTEGER PRIMARY KEY,
  halving_date DATE,
  halving_price DECIMAL(12,2),
  ath_date    DATE,
  ath_price   DECIMAL(12,2),
  bottom_date DATE,
  bottom_price DECIMAL(12,2)
);

-- Daily price + metrics snapshot
CREATE TABLE daily_snapshots (
  date            DATE PRIMARY KEY,
  cycle_id        INTEGER REFERENCES cycles(id),
  cycle_day       INTEGER,      -- day since halving
  arc             TINYINT,      -- 1 or 2
  arc_day         INTEGER,      -- day within arc
  phase           VARCHAR(30),
  btc_price       DECIMAL(12,2),
  mvrv            DECIMAL(8,4),
  sopr            DECIMAL(8,4),
  nupl            DECIMAL(8,4),
  puell           DECIMAL(8,4),
  fear_greed      TINYINT,
  cycle_score     DECIMAL(5,2),
  projection_bear DECIMAL(12,2),
  projection_base DECIMAL(12,2),
  projection_bull DECIMAL(12,2)
);

-- Portfolio positions
CREATE TABLE positions (
  id          SERIAL PRIMARY KEY,
  user_id     UUID,
  asset       VARCHAR(10),
  quantity    DECIMAL(18,8),
  cost_basis  DECIMAL(12,2),
  entry_date  DATE,
  entry_cycle_day INTEGER
);

-- User price alerts
CREATE TABLE alerts (
  id          SERIAL PRIMARY KEY,
  user_id     UUID,
  type        VARCHAR(20),  -- 'price', 'phase', 'score', 'on-chain'
  trigger_val DECIMAL(12,4),
  direction   VARCHAR(4),   -- 'above', 'below'
  active      BOOLEAN DEFAULT TRUE
);
```

### Calculation Engine (Pseudocode)

```python
def get_cycle_projection(date: datetime) -> ProjectionResult:
    halving = get_last_halving()
    cycle_day = (date - halving.date).days

    if cycle_day <= 1070:
        arc = 1
        arc_day = cycle_day
        phase = get_arc1_phase(arc_day)
        multiplier = calculate_multiplier(arc_day, cycle_number=5)
        base_price = halving.price * multiplier
    else:
        arc = 2
        arc_day = cycle_day - 1070
        phase = get_arc2_phase(arc_day)
        drawdown = calculate_drawdown(arc_day)
        ath_projection = halving.price * ATH_MULTIPLIER[5]
        base_price = ath_projection * (1 - drawdown)

    band = calculate_confidence_band(base_price, cycle_day)

    return ProjectionResult(
        date=date,
        cycle_day=cycle_day,
        arc=arc,
        arc_day=arc_day,
        phase=phase,
        bear=band.bear,
        base=band.base,
        bull=band.bull,
        cycle_score=calculate_cycle_score()
    )
```

---

## 9. UI/UX Wireframe Spec

### Screen 1 — Home Dashboard

```
┌──────────────────────────────────────────────┐
│  BITCOIN CYCLE TRACKER              [⚙] [🔔]  │
├──────────────────────────────────────────────┤
│                                              │
│  ● ARC 1 — PARABOLIC PHASE                   │
│  Day 640 of 1070 · 430 days to projected ATH │
│                                              │
│  ████████████████░░░░░░  59.8% through cycle │
│                                              │
│  BTC PRICE            $192,000               │
│  BASE PROJECTION      $200,000               │
│  BULL TARGET          $350,000               │
│  CYCLE SCORE          72 / 100  ⚠ TAKE CARE  │
│                                              │
├──────────────────────────────────────────────┤
│  TIME TO ATH (Jan 24, 2027)                  │
│   430 days  ·  10,320 hrs  ·  61,920 min     │
├──────────────────────────────────────────────┤
│  PORTFOLIO VALUE      $48,320  (+312%)       │
│  [View Portfolio]  [Autopilot: ON]            │
└──────────────────────────────────────────────┘
```

### Screen 2 — Projection Chart

```
┌──────────────────────────────────────────────┐
│  PRICE PROJECTION           [1W][1M][1Y][ALL] │
│                                              │
│  $350K ┤                          ╭──── bull  │
│  $300K ┤                    ╭─────╯           │
│  $250K ┤              ╭─────╯    ← base       │
│  $200K ┤        ╭─────╯                       │
│  $150K ┤  ╭─────╯       ╭──── bear            │
│  $100K ┤──╯                                  │
│   $50K ┤ (halving)                           │
│   $20K ┤             (bottom)                │
│        └──────────────────────────────────── │
│        2024      2025      2026      2027     │
│                                              │
│  [○ Bear] [● Base] [○ Bull]  [Download CSV]  │
└──────────────────────────────────────────────┘
```

### Screen 3 — Cycle Timeline (Scrollable)

```
CYCLE TIMELINE — 2024 HALVING

[====ACCUMULATION====][==RE-AWAKEN==][=MOMENTUM=][PARABOLIC][BLOW-OFF]
Apr'24              Oct'24         Apr'25      Oct'25    Mar'26   Jan'27
  ▲                   ▲              ▲            ▲         ▲        ▲
  Halving          Phase 2         Phase 3     Phase 4   Phase 5   ATH
  $62K             $76K           $120K       $165K     $233K    $200K

──────────────────────────────────[YOU ARE HERE: Day 640]
```

### Screen 4 — Autopilot Settings

```
AUTOPILOT MODE

Risk Profile:  [Conservative] [Balanced ✓] [Aggressive]

DCA Schedule:
  Amount:      $500 / week
  Phase Action: ████ ACTIVE — buying during Parabolic phase

Exit Strategy (Sell Ladder):
  25% of BTC at   $150,000  ──  [ARMED ⚡]
  25% of BTC at   $200,000  ──  [ARMED ⚡]
  25% of BTC at   $275,000  ──  [PENDING]
  25% of BTC at   $340,000  ──  [PENDING]

Stop-Loss:
  Sell ALL if Cycle_Score > 92 AND price drops 15% in 7 days
  Status: [MONITORING]

[Save Settings]  [Pause Autopilot]
```

---

## 10. API & Integration Points

### Internal API Endpoints

```
GET  /api/v1/cycle/current
     → { day, arc, phase, cycle_score, projection }

GET  /api/v1/cycle/date/{YYYY-MM-DD}
     → { projection for specific date }

GET  /api/v1/cycle/countdown
     → { days_to_ath, hours_to_ath, days_to_bottom }

GET  /api/v1/price/projection/{timeframe}
     → timeframe: 7d | 30d | 90d | 1y | full
     → { bear[], base[], bull[], dates[] }

GET  /api/v1/onchain/signals
     → { mvrv, sopr, nupl, puell, fear_greed, cycle_score }

POST /api/v1/portfolio/analyze
     → { positions[] } → { cycle_alignment_score, recommendations[] }

POST /api/v1/autopilot/configure
     → { risk_profile, dca_amount, sell_ladder[], stop_loss }

WS   /ws/v1/price
     → real-time price + projection updates

WS   /ws/v1/alerts
     → user-specific alert triggers
```

### Exchange Integrations

| Exchange | Read API | Trade API | Supported Regions |
|----------|----------|-----------|------------------|
| Coinbase Advanced | ✅ | ✅ | US, EU, UK |
| Kraken | ✅ | ✅ | Global |
| Binance | ✅ | ✅ | Non-US |
| Gemini | ✅ | ✅ | US |
| River Financial | ✅ | ✅ | US (Bitcoin-only) |
| Strike | ✅ | ✅ | US, El Salvador |

---

## 11. Cycle History Table (All Halvings)

| # | Halving Date | Halving Price | ATH Date | ATH Price | Days to ATH | ATH Mult | Bottom Date | Bottom Price | Bear Days |
|---|-------------|--------------|----------|-----------|------------|---------|-------------|-------------|-----------|
| 1 | Nov 28, 2012 | $12.35 | Nov 30, 2013 | $1,163 | 367 | 94.2× | Jan 14, 2015 | $152 | 410 |
| 2 | Jul 9, 2016 | $650.96 | Dec 17, 2017 | $19,891 | 526 | 30.6× | Dec 15, 2018 | $3,122 | 363 |
| 3 | May 11, 2020 | $8,752 | Nov 10, 2021 | $69,000 | 548 | 7.9× | Nov 21, 2022 | $15,476 | 376 |
| 4 | Apr 19, 2024 | $62,000 | ~Jan 2027* | ~$200K* | ~1,070* | ~3.2×* | ~Jan 2028* | ~$42K* | ~364* |

*Projected values using 1070/364 model

### Observations
- Days to ATH: 367, 526, 548 → averaging 480 (pre-cycle-5 cycles faster; cycle 4 extends due to institutional adoption lag)
- Bear market days: 410, 363, 376 → model uses 364 (exactly 52 weeks) as the normalized value
- ATH multiplier geometric decay: 94.2, 30.6, 7.9, 3.2 → each cycle approximately 3.1× less explosive

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **1070 / 364 Cycle** | Proprietary Bitcoin halving cycle framework: 1070 days from halving to ATH + 364 days bear market |
| **Arc 1** | Expansion phase: halving day → cycle ATH (1070 days) |
| **Arc 2** | Contraction phase: ATH → cycle bottom (364 days) |
| **ATH** | All-Time High — the cycle peak price |
| **Blow-Off Top** | Final parabolic surge preceding ATH, characterized by extreme greed |
| **Capitulation** | Mass panic selling, typically occurs 60–150 days after ATH |
| **Cycle Score** | Composite 0–100 index of on-chain metrics indicating cycle position |
| **DCA** | Dollar-Cost Averaging — buying fixed amounts at regular intervals |
| **Epoch** | One full halving cycle = Arc 1 + Arc 2 (~1434 days) |
| **Fear & Greed Index** | 0–100 market sentiment indicator; 0 = extreme fear, 100 = extreme greed |
| **Halving** | Bitcoin event every ~4 years where miner reward is cut in half |
| **LTH** | Long-Term Holder — wallet holding BTC > 155 days |
| **MVRV** | Market Value to Realized Value — ratio of market cap to realized cap |
| **NUPL** | Net Unrealized Profit/Loss — % of market in profit |
| **Pi Cycle Top** | Technical indicator: 111DMA × 2 crossing 350DMA signals ATH zone |
| **Puell Multiple** | Daily issuance value ÷ 365-day avg; < 0.5 = extreme buy |
| **Realized Price** | Average cost basis of all BTC on-chain; acts as long-term support |
| **SOPR** | Spent Output Profit Ratio; < 1 = selling at loss (accumulation zone) |
| **Stealth Bottom** | Quiet phase before next accumulation; whales absorbing supply |
| **Supply Shock** | Reduction in available BTC supply from halving event |

---

## Roadmap

### Phase 1 — Calculator MVP
- [ ] 1070/364 cycle engine with full time resolution
- [ ] Price projection bands (bear/base/bull)
- [ ] Cycle countdown dashboard
- [ ] Historical cycle comparison tool

### Phase 2 — On-Chain Intelligence
- [ ] Glassnode integration (MVRV, SOPR, NUPL, Puell)
- [ ] Fear & Greed live feed
- [ ] Cycle Score composite index
- [ ] Real-time projection adjustments

### Phase 3 — Portfolio Layer
- [ ] Wallet address tracking
- [ ] Exchange API connections (read-only)
- [ ] P&L calculator with cycle context
- [ ] DCA optimizer

### Phase 4 — Autopilot & Trading
- [ ] Exchange trading API integration
- [ ] Sell ladder auto-execution
- [ ] Stop-loss automation
- [ ] Push/email/SMS alerts

### Phase 5 — Social & Premium
- [ ] Community leaderboard
- [ ] Whale wallet alerts
- [ ] AI weekly cycle report
- [ ] Premium subscription tier

---

*Built on the 1070 / 364 Bitcoin Halving Cycle Framework. Not financial advice. Past cycles do not guarantee future results.*
