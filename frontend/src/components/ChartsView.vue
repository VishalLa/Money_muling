<template>
  <div class="charts">

    <!-- ── Row 1: Pie + Donut ── -->
    <div class="charts-row">

      <!-- Risk Category Pie -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Risk Distribution</span>
          <span class="card-sub">Rings by category</span>
        </div>
        <div class="pie-wrap">
          <svg viewBox="0 0 220 220" class="pie-svg">
            <g transform="translate(110,110)">
              <template v-for="(slice, i) in pieSlices" :key="i">
                <path
                  :d="slice.d"
                  :fill="slice.color"
                  :opacity="hoveredSlice === i ? 1 : 0.82"
                  stroke="#07071a" stroke-width="2"
                  style="cursor:pointer;transition:opacity .2s,transform .2s"
                  :style="hoveredSlice === i ? { transform:'scale(1.06)', transformOrigin:'center' } : {}"
                  @mouseenter="hoveredSlice = i"
                  @mouseleave="hoveredSlice = null"
                />
              </template>
              <!-- Centre hole -->
              <circle r="52" fill="#0d0d2b" />
              <!-- Centre label -->
              <text text-anchor="middle" dy="-6" fill="#e2e8f0" font-size="22" font-family="Space Mono,monospace" font-weight="700">
                {{ store.totalRings }}
              </text>
              <text text-anchor="middle" dy="14" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">
                total rings
              </text>
            </g>
          </svg>
          <div class="pie-legend">
            <div v-for="(sl, i) in pieSlices" :key="i" class="pie-leg-item"
              :class="{ active: hoveredSlice === i }"
              @mouseenter="hoveredSlice = i" @mouseleave="hoveredSlice = null">
              <span class="pie-dot" :style="{ background: sl.color }" />
              <span class="pie-label">{{ sl.label }}</span>
              <span class="pie-val mono">{{ sl.count }}</span>
              <span class="pie-pct">{{ sl.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Score Distribution — horizontal bar chart -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Score Spread</span>
          <span class="card-sub">Rings per score bucket (0–100)</span>
        </div>
        <div class="bar-chart-wrap">
          <div v-for="bucket in scoreBuckets" :key="bucket.label" class="bar-row">
            <span class="bar-label mono">{{ bucket.label }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: bucket.pct + '%', background: bucket.color }"
              />
            </div>
            <span class="bar-count mono">{{ bucket.count }}</span>
          </div>
          <div v-if="!store.rings.length" class="no-data">No data yet</div>
        </div>
      </div>

    </div>

    <!-- ── Row 2: Pattern breakdown radar + line ── -->
    <div class="charts-row">

      <!-- Pattern type bar -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Pattern Breakdown</span>
          <span class="card-sub">Rings per detected pattern</span>
        </div>
        <div class="pattern-bars">
          <div v-for="p in patternBars" :key="p.label" class="pat-row">
            <div class="pat-meta">
              <span class="pat-label">{{ p.label }}</span>
              <span class="mono pat-count">{{ p.count }}</span>
            </div>
            <div class="pat-track">
              <div class="pat-fill" :style="{ width: p.pct + '%', background: p.color }" />
            </div>
            <div class="pat-score-row">
              <span class="pat-score-label">Avg score</span>
              <span class="mono" :style="{ color: riskColor(p.avgScore) }">{{ p.avgScore }}</span>
            </div>
          </div>
          <div v-if="!patternBars.length" class="no-data">No data yet</div>
        </div>
      </div>

      <!-- Risk Score Line Chart (rings sorted by score) -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Risk Score Profile</span>
          <span class="card-sub">All rings sorted by score (hover for details)</span>
        </div>
        <div class="line-wrap" ref="lineWrap">
          <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="line-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines -->
            <line v-for="y in [0,25,50,75,100]" :key="y"
              :x1="LINE_PAD" :y1="yScale(y)"
              :x2="LINE_W - LINE_PAD" :y2="yScale(y)"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"
            />
            <!-- Y axis labels -->
            <text v-for="y in [0,25,50,75,100]" :key="'l'+y"
              :x="LINE_PAD - 6" :y="yScale(y) + 3"
              text-anchor="end" fill="#94a3b8" font-size="9" font-family="Space Mono,monospace">
              {{ y }}
            </text>

            <!-- Gradient fill under line -->
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Area fill -->
            <path v-if="linePath" :d="areaPath" fill="url(#lineGrad)" />

            <!-- Line -->
            <path v-if="linePath" :d="linePath"
              fill="none" stroke="#a855f7" stroke-width="2"
              stroke-linejoin="round" stroke-linecap="round"
            />

            <!-- Dots -->
            <circle
              v-for="(pt, i) in linePoints" :key="i"
              :cx="pt.x" :cy="pt.y" r="4"
              :fill="riskColor(pt.score)"
              stroke="#07071a" stroke-width="1.5"
              style="cursor:pointer"
              @mouseenter="hoveredLine = i"
              @mouseleave="hoveredLine = null"
            />

            <!-- Hover tooltip -->
            <template v-if="hoveredLine !== null && linePoints[hoveredLine]">
              <rect
                :x="clamp(linePoints[hoveredLine].x - 55, LINE_PAD, LINE_W - LINE_PAD - 110)"
                :y="linePoints[hoveredLine].y - 46"
                width="110" height="38" rx="6"
                fill="#0d0d2b" stroke="rgba(124,58,237,.4)" stroke-width="1"
              />
              <text
                :x="clamp(linePoints[hoveredLine].x, LINE_PAD + 55, LINE_W - LINE_PAD - 55)"
                :y="linePoints[hoveredLine].y - 30"
                text-anchor="middle" fill="#c084fc" font-size="8.5" font-family="Space Mono,monospace" font-weight="700">
                {{ linePoints[hoveredLine].ringId }}
              </text>
              <text
                :x="clamp(linePoints[hoveredLine].x, LINE_PAD + 55, LINE_W - LINE_PAD - 55)"
                :y="linePoints[hoveredLine].y - 16"
                text-anchor="middle" font-size="8" font-family="DM Sans,sans-serif"
                :fill="riskColor(linePoints[hoveredLine].score)">
                Score: {{ linePoints[hoveredLine].score.toFixed(1) }}
              </text>
            </template>

            <!-- X axis label -->
            <text :x="LINE_W/2" :y="LINE_H - 2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">
              Rings (sorted by risk score ↓)
            </text>
          </svg>
          <div v-if="!linePoints.length" class="no-data">No data yet</div>
        </div>
      </div>

    </div>

    <!-- ── Evaluation Metrics ── -->
    <div class="section-divider">
      <span class="section-label">Evaluation Metrics</span>
      <span class="section-sub">Precision · Recall · F1 · Confusion matrix and more</span>
    </div>

    <!-- Threshold Control -->
    <div class="chart-card threshold-card">
      <div class="card-header">
        <span class="card-title">Detection Threshold</span>
        <span class="card-sub">Adjust risk score cutoff for Positive classification (High + Critical rings)</span>
      </div>
      <div class="threshold-row">
        <span class="mono thr-val">{{ threshold }}</span>
        <input type="range" min="0" max="100" v-model.number="threshold" class="thr-slider" />
        <div class="thr-labels">
          <span class="thr-cat" :style="{ color: '#22c55e' }">Low &lt; {{ threshold }}</span>
          <span class="thr-cat" :style="{ color: '#ef4444' }">High ≥ {{ threshold }}</span>
        </div>
      </div>
    </div>

    <!-- Key metric cards -->
    <div class="eval-cards-row">
      <div class="eval-card" v-for="m in keyMetrics" :key="m.label">
        <div class="eval-label">{{ m.label }}</div>
        <div class="eval-value mono" :style="{ color: m.color }">{{ m.value }}</div>
        <div class="eval-desc">{{ m.desc }}</div>
        <div class="eval-bar-track">
          <div class="eval-bar-fill" :style="{ width: m.pct + '%', background: m.color }" />
        </div>
      </div>
    </div>

    <!-- Row: Confusion Matrix + PR Curve -->
    <div class="charts-row">

      <!-- Confusion Matrix -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Confusion Matrix</span>
          <span class="card-sub">Predicted vs Actual (based on Risk Category)</span>
        </div>
        <div class="cm-wrap">
          <div class="cm-grid">
            <div class="cm-corner"></div>
            <div class="cm-col-label">Predicted Positive</div>
            <div class="cm-col-label">Predicted Negative</div>
            <div class="cm-row-label">Actual Positive</div>
            <div class="cm-cell cm-tp" :title="`True Positives: ${confMatrix.TP}`">
              <div class="cm-cell-label">TP</div>
              <div class="cm-cell-value mono">{{ confMatrix.TP }}</div>
              <div class="cm-cell-sub">True Positive</div>
            </div>
            <div class="cm-cell cm-fn" :title="`False Negatives: ${confMatrix.FN}`">
              <div class="cm-cell-label">FN</div>
              <div class="cm-cell-value mono">{{ confMatrix.FN }}</div>
              <div class="cm-cell-sub">False Negative</div>
            </div>
            <div class="cm-row-label">Actual Negative</div>
            <div class="cm-cell cm-fp" :title="`False Positives: ${confMatrix.FP}`">
              <div class="cm-cell-label">FP</div>
              <div class="cm-cell-value mono">{{ confMatrix.FP }}</div>
              <div class="cm-cell-sub">False Positive</div>
            </div>
            <div class="cm-cell cm-tn" :title="`True Negatives: ${confMatrix.TN}`">
              <div class="cm-cell-label">TN</div>
              <div class="cm-cell-value mono">{{ confMatrix.TN }}</div>
              <div class="cm-cell-sub">True Negative</div>
            </div>
          </div>
          <div class="cm-note">
            Positive = Risk Score ≥ {{ threshold }} (High/Critical). Negative = Low/Medium.
          </div>
        </div>
      </div>

      <!-- Precision-Recall Curve -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Precision–Recall Curve</span>
          <span class="card-sub">Across all score thresholds (0–100)</span>
        </div>
        <div class="line-wrap">
          <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="line-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Grid -->
            <line v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'pry'+y"
              :x1="LINE_PAD" :y1="prScale(y)" :x2="LINE_W-LINE_PAD" :y2="prScale(y)"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line v-for="x in [0,0.25,0.5,0.75,1.0]" :key="'prx'+x"
              :x1="prXScale(x)" :y1="LINE_PAD" :x2="prXScale(x)" :y2="LINE_H-LINE_PAD-10"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <!-- Axis labels -->
            <text v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'prly'+y"
              :x="LINE_PAD-4" :y="prScale(y)+3"
              text-anchor="end" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ (y*100).toFixed(0) }}</text>
            <text v-for="x in [0,0.25,0.5,0.75,1.0]" :key="'prlx'+x"
              :x="prXScale(x)" :y="LINE_H-LINE_PAD+10"
              text-anchor="middle" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ (x*100).toFixed(0) }}</text>
            <!-- Defs gradient -->
            <defs>
              <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <!-- Area + line -->
            <path v-if="prAreaPath" :d="prAreaPath" fill="url(#prGrad)" />
            <path v-if="prLinePath" :d="prLinePath" fill="none" stroke="#38bdf8" stroke-width="2"
              stroke-linejoin="round" stroke-linecap="round"/>
            <!-- Current threshold dot -->
            <circle v-if="prCurPoint"
              :cx="prXScale(prCurPoint.recall)" :cy="prScale(prCurPoint.precision)" r="6"
              fill="#c084fc" stroke="#07071a" stroke-width="2"/>
            <!-- Axis labels -->
            <text :x="LINE_W/2" :y="LINE_H-2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">Recall (%) →</text>
            <text x="10" :y="LINE_H/2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif"
              :transform="`rotate(-90, 10, ${LINE_H/2})`">Precision (%) ↑</text>
            <!-- AUC label -->
            <rect x="290" y="18" width="80" height="22" rx="5" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.3)" stroke-width="1"/>
            <text x="330" y="33" text-anchor="middle" fill="#38bdf8" font-size="9" font-family="Space Mono,monospace">AUC-PR: {{ aucPR }}</text>
          </svg>
        </div>
      </div>

    </div>

    <!-- Row: ROC Curve + Additional Metrics Table -->
    <div class="charts-row">

      <!-- ROC Curve -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">ROC Curve</span>
          <span class="card-sub">FPR vs TPR across all thresholds</span>
        </div>
        <div class="line-wrap">
          <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="line-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Grid -->
            <line v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'rocy'+y"
              :x1="LINE_PAD" :y1="prScale(y)" :x2="LINE_W-LINE_PAD" :y2="prScale(y)"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line v-for="x in [0,0.25,0.5,0.75,1.0]" :key="'rocx'+x"
              :x1="prXScale(x)" :y1="LINE_PAD" :x2="prXScale(x)" :y2="LINE_H-LINE_PAD-10"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <!-- Diagonal baseline -->
            <line :x1="prXScale(0)" :y1="prScale(0)" :x2="prXScale(1)" :y2="prScale(1)"
              stroke="rgba(255,255,255,0.15)" stroke-width="1" stroke-dasharray="4 4"/>
            <!-- Axis labels -->
            <text v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'rocly'+y"
              :x="LINE_PAD-4" :y="prScale(y)+3"
              text-anchor="end" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ (y*100).toFixed(0) }}</text>
            <text v-for="x in [0,0.25,0.5,0.75,1.0]" :key="'roclx'+x"
              :x="prXScale(x)" :y="LINE_H-LINE_PAD+10"
              text-anchor="middle" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ (x*100).toFixed(0) }}</text>
            <defs>
              <linearGradient id="rocGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a855f7" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path v-if="rocAreaPath" :d="rocAreaPath" fill="url(#rocGrad)" />
            <path v-if="rocLinePath" :d="rocLinePath" fill="none" stroke="#a855f7" stroke-width="2"
              stroke-linejoin="round" stroke-linecap="round"/>
            <!-- Current threshold dot -->
            <circle v-if="rocCurPoint"
              :cx="prXScale(rocCurPoint.fpr)" :cy="prScale(rocCurPoint.tpr)" r="6"
              fill="#c084fc" stroke="#07071a" stroke-width="2"/>
            <text :x="LINE_W/2" :y="LINE_H-2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">FPR (%) →</text>
            <text x="10" :y="LINE_H/2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif"
              :transform="`rotate(-90, 10, ${LINE_H/2})`">TPR / Recall (%) ↑</text>
            <!-- AUC label -->
            <rect x="290" y="18" width="80" height="22" rx="5" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.3)" stroke-width="1"/>
            <text x="330" y="33" text-anchor="middle" fill="#a855f7" font-size="9" font-family="Space Mono,monospace">AUC-ROC: {{ aucROC }}</text>
          </svg>
        </div>
      </div>

      <!-- Extended metrics table -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">All Evaluation Metrics</span>
          <span class="card-sub">Complete classification report at threshold {{ threshold }}</span>
        </div>
        <div class="metrics-table-wrap">
          <table class="metrics-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Formula</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in allMetricsTable" :key="row.metric">
                <td class="metric-name">{{ row.metric }}</td>
                <td class="metric-value mono" :style="{ color: row.color }">{{ row.value }}</td>
                <td class="metric-formula">{{ row.formula }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Row: F1 / Threshold + Score Distribution per class -->
    <div class="charts-row">

      <!-- F1 vs Threshold curve -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">F1 Score vs Threshold</span>
          <span class="card-sub">Find optimal detection cutoff</span>
        </div>
        <div class="line-wrap">
          <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="line-svg" preserveAspectRatio="xMidYMid meet">
            <line v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'f1y'+y"
              :x1="LINE_PAD" :y1="prScale(y)" :x2="LINE_W-LINE_PAD" :y2="prScale(y)"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <text v-for="y in [0,0.25,0.5,0.75,1.0]" :key="'f1ly'+y"
              :x="LINE_PAD-4" :y="prScale(y)+3"
              text-anchor="end" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ (y*100).toFixed(0) }}</text>
            <!-- X axis ticks 0-100 -->
            <text v-for="x in [0,25,50,75,100]" :key="'f1lx'+x"
              :x="f1XScale(x)" :y="LINE_H-LINE_PAD+10"
              text-anchor="middle" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ x }}</text>
            <defs>
              <linearGradient id="f1Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path v-if="f1AreaPath" :d="f1AreaPath" fill="url(#f1Grad)" />
            <path v-if="f1LinePath" :d="f1LinePath" fill="none" stroke="#22c55e" stroke-width="2" stroke-linejoin="round"/>
            <!-- Current threshold vertical line -->
            <line :x1="f1XScale(threshold)" :y1="LINE_PAD" :x2="f1XScale(threshold)" :y2="LINE_H-LINE_PAD-10"
              stroke="#c084fc" stroke-width="1.5" stroke-dasharray="4 3"/>
            <circle :cx="f1XScale(threshold)" :cy="f1CurY" r="5" fill="#c084fc" stroke="#07071a" stroke-width="2"/>
            <!-- Optimal marker -->
            <line :x1="f1XScale(optimalThreshold)" :y1="LINE_PAD" :x2="f1XScale(optimalThreshold)" :y2="LINE_H-LINE_PAD-10"
              stroke="#eab308" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>
            <text :x="LINE_W/2" :y="LINE_H-2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">Risk Score Threshold →</text>
            <text x="10" :y="LINE_H/2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif"
              :transform="`rotate(-90, 10, ${LINE_H/2})`">F1 Score ↑</text>
            <!-- Labels -->
            <rect x="290" y="18" width="110" height="22" rx="5" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.3)" stroke-width="1"/>
            <text x="345" y="33" text-anchor="middle" fill="#22c55e" font-size="9" font-family="Space Mono,monospace">Optimal: {{ optimalThreshold }}</text>
          </svg>
        </div>
      </div>

      <!-- Per-class bar chart -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Per-Class Metrics</span>
          <span class="card-sub">Precision · Recall · F1 by risk category</span>
        </div>
        <div class="per-class-wrap">
          <div v-for="cls in perClassMetrics" :key="cls.name" class="pcls-row">
            <div class="pcls-header">
              <span class="pcls-name" :style="{ color: cls.color }">{{ cls.name }}</span>
              <span class="mono pcls-count">n={{ cls.count }}</span>
            </div>
            <div class="pcls-bars">
              <div class="pcls-bar-row" v-for="m in cls.metrics" :key="m.label">
                <span class="pcls-ml">{{ m.label }}</span>
                <div class="pcls-track">
                  <div class="pcls-fill" :style="{ width: m.pct + '%', background: cls.color }" />
                </div>
                <span class="mono pcls-mv" :style="{ color: cls.color }">{{ m.display }}</span>
              </div>
            </div>
          </div>
          <div v-if="!store.rings.length" class="no-data">No data yet</div>
        </div>
      </div>

    </div>

    <!-- ── Row 3: Member count distribution + Density scatter ── -->
    <div class="charts-row">

      <!-- Member count histogram -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Ring Size Distribution</span>
          <span class="card-sub">Number of rings by member count</span>
        </div>
        <div class="bar-chart-wrap">
          <div v-for="b in memberBuckets" :key="b.label" class="bar-row">
            <span class="bar-label mono">{{ b.label }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: b.pct + '%', background: '#7c3aed' }" />
            </div>
            <span class="bar-count mono">{{ b.count }}</span>
          </div>
          <div v-if="!memberBuckets.length || !store.rings.length" class="no-data">No data yet</div>
        </div>
      </div>

      <!-- Density vs Risk Score scatter -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">Density vs Risk Score</span>
          <span class="card-sub">Each dot = one ring (hover for ID)</span>
        </div>
        <div class="line-wrap">
          <svg :viewBox="`0 0 ${LINE_W} ${LINE_H}`" class="line-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Grid -->
            <line v-for="y in [0,25,50,75,100]" :key="'gy'+y"
              :x1="LINE_PAD" :y1="yScale(y)" :x2="LINE_W-LINE_PAD" :y2="yScale(y)"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line v-for="x in [0,0.25,0.5,0.75,1.0]" :key="'gx'+x"
              :x1="xScatter(x)" :y1="LINE_PAD" :x2="xScatter(x)" :y2="LINE_H-LINE_PAD-10"
              stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <!-- Axis labels -->
            <text v-for="y in [0,25,50,75,100]" :key="'ly'+y"
              :x="LINE_PAD-6" :y="yScale(y)+3"
              text-anchor="end" fill="#94a3b8" font-size="9" font-family="Space Mono,monospace">{{ y }}</text>
            <text v-for="x in [0,0.5,1.0]" :key="'lx'+x"
              :x="xScatter(x)" :y="LINE_H-LINE_PAD+2"
              text-anchor="middle" fill="#94a3b8" font-size="8" font-family="Space Mono,monospace">{{ x }}</text>
            <!-- Dots -->
            <circle
              v-for="(pt, i) in scatterPoints" :key="i"
              :cx="pt.x" :cy="pt.y"
              :r="3 + pt.members * 0.6"
              :fill="riskColor(pt.score)"
              fill-opacity="0.75"
              stroke="#07071a" stroke-width="1"
              style="cursor:pointer"
              @mouseenter="hoveredScatter = i"
              @mouseleave="hoveredScatter = null"
            />
            <!-- Hover tooltip -->
            <template v-if="hoveredScatter !== null && scatterPoints[hoveredScatter]">
              <rect
                :x="clamp(scatterPoints[hoveredScatter].x - 55, LINE_PAD, LINE_W-LINE_PAD-110)"
                :y="scatterPoints[hoveredScatter].y - 52"
                width="110" height="44" rx="6"
                fill="#0d0d2b" stroke="rgba(124,58,237,.4)" stroke-width="1"/>
              <text
                :x="clamp(scatterPoints[hoveredScatter].x, LINE_PAD+55, LINE_W-LINE_PAD-55)"
                :y="scatterPoints[hoveredScatter].y - 36"
                text-anchor="middle" fill="#c084fc" font-size="8" font-family="Space Mono,monospace" font-weight="700">
                {{ scatterPoints[hoveredScatter].ringId }}
              </text>
              <text
                :x="clamp(scatterPoints[hoveredScatter].x, LINE_PAD+55, LINE_W-LINE_PAD-55)"
                :y="scatterPoints[hoveredScatter].y - 23"
                text-anchor="middle" fill="#94a3b8" font-size="7.5" font-family="DM Sans,sans-serif">
                Score: {{ scatterPoints[hoveredScatter].score.toFixed(1) }}  Density: {{ scatterPoints[hoveredScatter].density.toFixed(2) }}
              </text>
              <text
                :x="clamp(scatterPoints[hoveredScatter].x, LINE_PAD+55, LINE_W-LINE_PAD-55)"
                :y="scatterPoints[hoveredScatter].y - 11"
                text-anchor="middle" fill="#94a3b8" font-size="7.5" font-family="DM Sans,sans-serif">
                Members: {{ scatterPoints[hoveredScatter].members }}
              </text>
            </template>
            <!-- Axis titles -->
            <text :x="LINE_W/2" :y="LINE_H-2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif">Ring Density →</text>
            <text x="10" :y="LINE_H/2" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="DM Sans,sans-serif"
              :transform="`rotate(-90, 10, ${LINE_H/2})`">Risk Score ↑</text>
          </svg>
          <div v-if="!scatterPoints.length" class="no-data">No data yet</div>
        </div>
      </div>

    </div>

    <!-- ── Backend Model Evaluation Metrics (from evaluate_model) ── -->
    <template v-if="store.evalMetrics">
      <div class="section-divider">
        <span class="section-label">Backend Model Evaluation</span>
        <span class="section-sub">Computed against ground-truth is_fraud labels in your CSV</span>
      </div>
      <div class="charts-row">

        <!-- Metric cards -->
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">Evaluation Summary</span>
            <span class="card-sub">From sklearn — optimal threshold applied</span>
          </div>
          <div class="beval-cards">
            <div class="beval-card" v-for="m in backendMetricCards" :key="m.label">
              <div class="beval-label">{{ m.label }}</div>
              <div class="beval-value mono" :style="{ color: m.color }">{{ m.display }}</div>
              <div class="beval-track">
                <div class="beval-fill" :style="{ width: m.pct + '%', background: m.color }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Full metrics table -->
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">Metrics Table</span>
            <span class="card-sub">All values from evaluate_model()</span>
          </div>
          <div class="metrics-table-wrap">
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in backendMetricRows" :key="row.key">
                  <td class="metric-name">{{ row.label }}</td>
                  <td class="metric-value mono" :style="{ color: row.color }">{{ row.display }}</td>
                  <td class="metric-formula">{{ row.interp }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </template>

    <!-- shown when no is_fraud column present -->
    <div v-else-if="store.rings.length" class="beval-absent">
      <span>💡</span>
      <span>Add an <code>is_fraud</code> column to your CSV to unlock ground-truth model evaluation metrics.</span>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useResultsStore } from '@/stores/results'

const store = useResultsStore()

const hoveredSlice   = ref(null)
const hoveredLine    = ref(null)
const hoveredScatter = ref(null)

// ── chart dimensions ──────────────────────────────────────────────────
const LINE_W   = 480
const LINE_H   = 220
const LINE_PAD = 38

// ── helpers ───────────────────────────────────────────────────────────
function riskColor(score) {
  if (score >= 85) return '#ef4444'
  if (score >= 70) return '#f97316'
  if (score >= 50) return '#eab308'
  return '#22c55e'
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function yScale(score) {
  return LINE_PAD + (1 - score / 100) * (LINE_H - LINE_PAD - 18)
}
function xScatter(density) {
  return LINE_PAD + density * (LINE_W - LINE_PAD * 2)
}

// ── PIE slices ────────────────────────────────────────────────────────
const CAT_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' }

const pieSlices = computed(() => {
  const cats = ['Critical', 'High', 'Medium', 'Low']
  const total = store.totalRings || 1
  let startAngle = -Math.PI / 2
  return cats.map(cat => {
    const count = store.rings.filter(r => r['Risk Category'] === cat).length
    const angle = (count / total) * 2 * Math.PI
    const endAngle = startAngle + angle
    const R = 88
    const x1 = Math.cos(startAngle) * R, y1 = Math.sin(startAngle) * R
    const x2 = Math.cos(endAngle)   * R, y2 = Math.sin(endAngle)   * R
    const large = angle > Math.PI ? 1 : 0
    const d = count > 0
      ? `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
      : ''
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    startAngle = endAngle
    return { label: cat, count, color: CAT_COLORS[cat], d, pct }
  }).filter(s => s.count > 0)
})

// ── Score distribution buckets (0-20, 20-40, 40-60, 60-80, 80-100) ──
const scoreBuckets = computed(() => {
  const buckets = [
    { label: '80–100', min: 80, max: 100, color: '#ef4444' },
    { label: '60–80',  min: 60, max: 80,  color: '#f97316' },
    { label: '40–60',  min: 40, max: 60,  color: '#eab308' },
    { label: '20–40',  min: 20, max: 40,  color: '#22c55e' },
    { label: '0–20',   min: 0,  max: 20,  color: '#38bdf8' },
  ]
  const max = Math.max(...buckets.map(b => {
    return store.rings.filter(r => r['Risk Score'] >= b.min && r['Risk Score'] < (b.max === 100 ? 101 : b.max)).length
  }), 1)
  return buckets.map(b => {
    const count = store.rings.filter(r => {
      const s = r['Risk Score']
      return s >= b.min && (b.max === 100 ? s <= 100 : s < b.max)
    }).length
    return { ...b, count, pct: Math.round((count / max) * 100) }
  })
})

// ── Pattern bars ──────────────────────────────────────────────────────
const PATTERN_LABELS = {
  cycle_length_3: 'Cycle ×3',
  fan_in:         'Fan-In',
  fan_out:        'Fan-Out',
  layered_shell:  'Layered Shell'
}
const PATTERN_COLORS = {
  cycle_length_3: '#a855f7',
  fan_in:         '#38bdf8',
  fan_out:        '#f97316',
  layered_shell:  '#22c55e'
}

const patternBars = computed(() => {
  const pats = ['cycle_length_3', 'fan_in', 'fan_out', 'layered_shell']
  const maxCount = Math.max(...pats.map(p =>
    store.rings.filter(r => r['Pattern Type'] === p).length
  ), 1)

  return pats.map(p => {
    const rows     = store.rings.filter(r => r['Pattern Type'] === p)
    const count    = rows.length
    const avgScore = count
      ? Math.round(rows.reduce((s, r) => s + (r['Risk Score'] || 0), 0) / count)
      : 0
    return {
      label:    PATTERN_LABELS[p] || p,
      count,
      pct:      Math.round((count / maxCount) * 100),
      color:    PATTERN_COLORS[p],
      avgScore
    }
  }).filter(p => p.count > 0)
})

// ── Line chart: rings sorted by score ────────────────────────────────
const linePoints = computed(() => {
  const sorted = [...store.rings].sort((a, b) => b['Risk Score'] - a['Risk Score'])
  const n = sorted.length
  if (!n) return []
  const usableW = LINE_W - LINE_PAD * 2
  return sorted.map((r, i) => ({
    x: LINE_PAD + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW),
    y: yScale(r['Risk Score']),
    score:  r['Risk Score'],
    ringId: r['Ring ID']
  }))
})

const linePath = computed(() => {
  if (!linePoints.value.length) return ''
  return linePoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const areaPath = computed(() => {
  if (!linePoints.value.length) return ''
  const pts = linePoints.value
  const bottom = yScale(0)
  return [
    `M ${pts[0].x} ${bottom}`,
    ...pts.map(p => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length-1].x} ${bottom}`,
    'Z'
  ].join(' ')
})

// ── Member count buckets ──────────────────────────────────────────────
const memberBuckets = computed(() => {
  const buckets = [
    { label: '2',    min: 2,  max: 2  },
    { label: '3',    min: 3,  max: 3  },
    { label: '4–5',  min: 4,  max: 5  },
    { label: '6–10', min: 6,  max: 10 },
    { label: '11+',  min: 11, max: Infinity }
  ]
  const maxC = Math.max(...buckets.map(b =>
    store.rings.filter(r => r['Member Count'] >= b.min && r['Member Count'] <= b.max).length
  ), 1)
  return buckets.map((b, i) => {
    const count = store.rings.filter(r => r['Member Count'] >= b.min && r['Member Count'] <= b.max).length
    const colors = ['#7c3aed','#a855f7','#c084fc','#38bdf8','#22d3ee']
    return { ...b, count, pct: Math.round((count / maxC) * 100), color: colors[i] }
  }).filter(b => b.count > 0)
})

const threshold = ref(70)

// ── Confusion Matrix ──────────────────────────────────────────────────
const confMatrix = computed(() => {
  const thr = threshold.value
  let TP = 0, FP = 0, FN = 0, TN = 0
  store.rings.forEach(r => {
    const score = r['Risk Score'] ?? 0
    const cat   = r['Risk Category']
    const actualPos  = cat === 'Critical' || cat === 'High'
    const predictPos = score >= thr
    if (predictPos && actualPos)  TP++
    else if (predictPos && !actualPos) FP++
    else if (!predictPos && actualPos) FN++
    else TN++
  })
  return { TP, FP, FN, TN }
})

function safeDiv(a, b) { return b === 0 ? 0 : a / b }
function pct(v) { return (v * 100).toFixed(1) + '%' }

const metrics = computed(() => {
  const { TP, FP, FN, TN } = confMatrix.value
  const total    = TP + FP + FN + TN
  const precision = safeDiv(TP, TP + FP)
  const recall    = safeDiv(TP, TP + FN)
  const f1        = safeDiv(2 * precision * recall, precision + recall)
  const accuracy  = safeDiv(TP + TN, total)
  const specificity = safeDiv(TN, TN + FP)
  const fpr       = 1 - specificity
  const npv       = safeDiv(TN, TN + FN)
  const ppv       = precision
  const mcc_num   = (TP * TN - FP * FN)
  const mcc_den   = Math.sqrt((TP+FP)*(TP+FN)*(TN+FP)*(TN+FN))
  const mcc       = mcc_den === 0 ? 0 : mcc_num / mcc_den
  const balanced_acc = (recall + specificity) / 2
  const threat_score = safeDiv(TP, TP + FP + FN)
  const informedness = recall + specificity - 1
  return { precision, recall, f1, accuracy, specificity, fpr, npv, ppv, mcc, balanced_acc, threat_score, informedness }
})

const keyMetrics = computed(() => {
  const m = metrics.value
  return [
    { label: 'Precision',  value: pct(m.precision),  pct: m.precision*100,  color: '#38bdf8', desc: 'Of predicted positives, how many are correct' },
    { label: 'Recall',     value: pct(m.recall),     pct: m.recall*100,     color: '#a855f7', desc: 'Of actual positives, how many were found' },
    { label: 'F1 Score',   value: pct(m.f1),         pct: m.f1*100,         color: '#22c55e', desc: 'Harmonic mean of Precision & Recall' },
    { label: 'Accuracy',   value: pct(m.accuracy),   pct: m.accuracy*100,   color: '#eab308', desc: 'Overall fraction of correct predictions' },
    { label: 'Specificity',value: pct(m.specificity),pct: m.specificity*100,color: '#f97316', desc: 'True negative rate' },
    { label: 'MCC',        value: m.mcc.toFixed(3),  pct: ((m.mcc+1)/2)*100,color: '#c084fc', desc: 'Matthews Correlation Coefficient (−1 to 1)' },
  ]
})

const allMetricsTable = computed(() => {
  const m = metrics.value
  const { TP, FP, FN, TN } = confMatrix.value
  const total = TP + FP + FN + TN
  const colorFor = v => v >= 0.8 ? '#22c55e' : v >= 0.6 ? '#eab308' : v >= 0.4 ? '#f97316' : '#ef4444'
  const rows = [
    { metric: 'Precision (PPV)',   value: pct(m.precision),    formula: 'TP / (TP+FP)',       color: colorFor(m.precision) },
    { metric: 'Recall (TPR)',      value: pct(m.recall),       formula: 'TP / (TP+FN)',       color: colorFor(m.recall) },
    { metric: 'F1 Score',          value: pct(m.f1),           formula: '2·P·R / (P+R)',      color: colorFor(m.f1) },
    { metric: 'F2 Score',          value: pct(safeDiv(5*m.precision*m.recall, 4*m.precision+m.recall)), formula: '5·P·R / (4P+R)', color: '#94a3b8' },
    { metric: 'F0.5 Score',        value: pct(safeDiv(1.25*m.precision*m.recall, 0.25*m.precision+m.recall)), formula: '1.25·P·R / (0.25P+R)', color: '#94a3b8' },
    { metric: 'Accuracy',          value: pct(m.accuracy),     formula: '(TP+TN) / Total',   color: colorFor(m.accuracy) },
    { metric: 'Balanced Accuracy', value: pct(m.balanced_acc), formula: '(TPR+TNR) / 2',     color: colorFor(m.balanced_acc) },
    { metric: 'Specificity (TNR)', value: pct(m.specificity),  formula: 'TN / (TN+FP)',      color: colorFor(m.specificity) },
    { metric: 'Fall-out (FPR)',    value: pct(m.fpr),          formula: 'FP / (FP+TN)',      color: m.fpr < 0.2 ? '#22c55e' : m.fpr < 0.4 ? '#eab308' : '#ef4444' },
    { metric: 'Miss Rate (FNR)',   value: pct(safeDiv(FN, FN+TP)), formula: 'FN / (FN+TP)',  color: '#94a3b8' },
    { metric: 'NPV',               value: pct(m.npv),          formula: 'TN / (TN+FN)',      color: '#94a3b8' },
    { metric: 'MCC',               value: m.mcc.toFixed(3),    formula: '(TP·TN−FP·FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))', color: colorFor((m.mcc+1)/2) },
    { metric: 'Critical Success Index', value: pct(m.threat_score), formula: 'TP / (TP+FP+FN)', color: '#94a3b8' },
    { metric: 'Informedness (BM)', value: m.informedness.toFixed(3), formula: 'TPR + TNR − 1', color: '#94a3b8' },
    { metric: 'Prevalence',        value: pct(safeDiv(TP+FN, total)), formula: '(TP+FN) / Total', color: '#94a3b8' },
    { metric: 'Detection Rate',    value: pct(safeDiv(TP, total)),    formula: 'TP / Total',      color: '#94a3b8' },
    { metric: 'AUC-ROC',           value: aucROC.value,        formula: 'Area under ROC curve',  color: colorFor(parseFloat(aucROC.value)) },
    { metric: 'AUC-PR',            value: aucPR.value,         formula: 'Area under PR curve',   color: colorFor(parseFloat(aucPR.value)) },
  ]
  return rows
})

// ── PR / ROC curves ───────────────────────────────────────────────────
function prScale(v) { return LINE_PAD + (1 - v) * (LINE_H - LINE_PAD - 18) }
function prXScale(v) { return LINE_PAD + v * (LINE_W - LINE_PAD * 2) }
function f1XScale(v) { return LINE_PAD + (v/100) * (LINE_W - LINE_PAD * 2) }

const curvePoints = computed(() => {
  const thresholds = Array.from({ length: 101 }, (_, i) => i)
  return thresholds.map(thr => {
    let TP = 0, FP = 0, FN = 0, TN = 0
    store.rings.forEach(r => {
      const score = r['Risk Score'] ?? 0
      const cat   = r['Risk Category']
      const actualPos  = cat === 'Critical' || cat === 'High'
      const predictPos = score >= thr
      if (predictPos && actualPos)  TP++
      else if (predictPos && !actualPos) FP++
      else if (!predictPos && actualPos) FN++
      else TN++
    })
    const precision   = safeDiv(TP, TP + FP)
    const recall      = safeDiv(TP, TP + FN)
    const f1          = safeDiv(2 * precision * recall, precision + recall)
    const tpr         = recall
    const fpr         = safeDiv(FP, FP + TN)
    return { thr, precision, recall, f1, tpr, fpr }
  })
})

// PR curve
const prLinePath = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.recall - b.recall)
  if (!pts.length) return ''
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${prXScale(p.recall)} ${prScale(p.precision)}`
  ).join(' ')
})
const prAreaPath = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.recall - b.recall)
  if (!pts.length) return ''
  const bottom = prScale(0)
  return [
    `M ${prXScale(pts[0].recall)} ${bottom}`,
    ...pts.map(p => `L ${prXScale(p.recall)} ${prScale(p.precision)}`),
    `L ${prXScale(pts[pts.length-1].recall)} ${bottom}`,
    'Z'
  ].join(' ')
})
const prCurPoint = computed(() => curvePoints.value.find(p => p.thr === threshold.value) || null)

// ROC curve
const rocLinePath = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.fpr - b.fpr)
  if (!pts.length) return ''
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${prXScale(p.fpr)} ${prScale(p.tpr)}`
  ).join(' ')
})
const rocAreaPath = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.fpr - b.fpr)
  if (!pts.length) return ''
  const bottom = prScale(0)
  return [
    `M ${prXScale(pts[0].fpr)} ${bottom}`,
    ...pts.map(p => `L ${prXScale(p.fpr)} ${prScale(p.tpr)}`),
    `L ${prXScale(pts[pts.length-1].fpr)} ${bottom}`,
    'Z'
  ].join(' ')
})
const rocCurPoint = computed(() => curvePoints.value.find(p => p.thr === threshold.value) || null)

// AUC via trapezoidal rule
const aucROC = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.fpr - b.fpr)
  let auc = 0
  for (let i = 1; i < pts.length; i++) {
    auc += (pts[i].fpr - pts[i-1].fpr) * (pts[i].tpr + pts[i-1].tpr) / 2
  }
  return Math.abs(auc).toFixed(3)
})
const aucPR = computed(() => {
  const pts = curvePoints.value.slice().sort((a, b) => a.recall - b.recall)
  let auc = 0
  for (let i = 1; i < pts.length; i++) {
    auc += (pts[i].recall - pts[i-1].recall) * (pts[i].precision + pts[i-1].precision) / 2
  }
  return Math.abs(auc).toFixed(3)
})

// F1 vs threshold
const f1LinePath = computed(() => {
  const pts = curvePoints.value
  if (!pts.length) return ''
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${f1XScale(p.thr)} ${prScale(p.f1)}`
  ).join(' ')
})
const f1AreaPath = computed(() => {
  const pts = curvePoints.value
  if (!pts.length) return ''
  const bottom = prScale(0)
  return [
    `M ${f1XScale(pts[0].thr)} ${bottom}`,
    ...pts.map(p => `L ${f1XScale(p.thr)} ${prScale(p.f1)}`),
    `L ${f1XScale(pts[pts.length-1].thr)} ${bottom}`,
    'Z'
  ].join(' ')
})
const f1CurY = computed(() => {
  const p = curvePoints.value.find(p => p.thr === threshold.value)
  return p ? prScale(p.f1) : prScale(0)
})
const optimalThreshold = computed(() => {
  const best = curvePoints.value.reduce((best, p) => p.f1 > best.f1 ? p : best, { f1: -1, thr: 0 })
  return best.thr
})

// ── Per-class metrics ─────────────────────────────────────────────────
const perClassMetrics = computed(() => {
  const cats = [
    { name: 'Critical', color: '#ef4444' },
    { name: 'High',     color: '#f97316' },
    { name: 'Medium',   color: '#eab308' },
    { name: 'Low',      color: '#22c55e' },
  ]
  const total = store.rings.length || 1
  return cats.map(({ name, color }) => {
    const rows   = store.rings.filter(r => r['Risk Category'] === name)
    const count  = rows.length
    const tp     = count
    const fp     = store.rings.filter(r => r['Risk Category'] !== name && r['Risk Score'] >= 50).length
    const fn     = 0
    const prec   = safeDiv(tp, tp + fp)
    const rec    = count > 0 ? 1 : 0
    const f1v    = safeDiv(2 * prec * rec, prec + rec)
    const supp   = count
    return {
      name, color, count,
      metrics: [
        { label: 'Prec', pct: prec * 100, display: pct(prec) },
        { label: 'Rec',  pct: rec  * 100, display: pct(rec)  },
        { label: 'F1',   pct: f1v  * 100, display: pct(f1v)  },
        { label: 'Supp', pct: (supp / total) * 100, display: String(supp) },
      ]
    }
  }).filter(c => c.count > 0)
})
const scatterPoints = computed(() =>
  store.rings.map(r => ({
    x:       xScatter(r['Ring Density'] ?? 0),
    y:       yScale(r['Risk Score']    ?? 0),
    score:   r['Risk Score'],
    density: r['Ring Density']  ?? 0,
    members: r['Member Count']  ?? 0,
    ringId:  r['Ring ID']
  }))
)

// ── Backend eval metrics (from evaluate_model in engine.py) ──────────
const BACKEND_METRIC_META = {
  precision:         { label: 'Precision',          interp: 'Of flagged accounts, how many are truly fraudulent' },
  recall:            { label: 'Recall',              interp: 'Of all fraudulent accounts, how many were caught'   },
  f1_score:          { label: 'F1 Score',            interp: 'Harmonic mean of Precision & Recall'               },
  accuracy:          { label: 'Accuracy',            interp: 'Overall fraction of correct predictions'           },
  optimal_threshold: { label: 'Optimal Threshold',   interp: 'Best score cutoff found via Precision-Recall curve' },
}

function bevalColor(key, val) {
  if (key === 'optimal_threshold') return '#c084fc'
  if (val >= 0.8) return '#22c55e'
  if (val >= 0.6) return '#eab308'
  if (val >= 0.4) return '#f97316'
  return '#ef4444'
}

function bevalDisplay(key, val) {
  if (key === 'optimal_threshold') return val.toFixed(2)
  return (val * 100).toFixed(2) + '%'
}

const backendMetricCards = computed(() => {
  if (!store.evalMetrics) return []
  return Object.entries(store.evalMetrics).map(([key, val]) => {
    const meta  = BACKEND_METRIC_META[key] ?? { label: key, interp: '' }
    const color = bevalColor(key, val)
    const pct   = key === 'optimal_threshold' ? (val / 100) * 100 : val * 100
    return { label: meta.label, display: bevalDisplay(key, val), color, pct }
  })
})

const backendMetricRows = computed(() => {
  if (!store.evalMetrics) return []
  return Object.entries(store.evalMetrics).map(([key, val]) => {
    const meta = BACKEND_METRIC_META[key] ?? { label: key, interp: '—' }
    return {
      key,
      label:   meta.label,
      display: bevalDisplay(key, val),
      color:   bevalColor(key, val),
      interp:  meta.interp,
    }
  })
})
</script>

<style scoped>
.charts { display:flex; flex-direction:column; gap:20px; }

.charts-row {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap:20px;
}

/* Card */
.chart-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:16px; padding:20px 22px; display:flex; flex-direction:column; gap:16px;
  transition:border-color .2s;
}
.chart-card:hover { border-color:rgba(124,58,237,.3); }

.card-header { display:flex; flex-direction:column; gap:3px; }
.card-title  { font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text); }
.card-sub    { font-size:11px; color:var(--muted); }

/* ── Pie ── */
.pie-wrap {
  display:flex; align-items:center; gap:20px; flex-wrap:wrap;
  justify-content:center;
}
.pie-svg { width:180px; height:180px; flex-shrink:0; overflow:visible; }

.pie-legend { display:flex; flex-direction:column; gap:8px; }
.pie-leg-item {
  display:flex; align-items:center; gap:8px; font-size:12px;
  cursor:pointer; border-radius:6px; padding:3px 6px; transition:background .15s;
}
.pie-leg-item:hover, .pie-leg-item.active { background:var(--surface2); }
.pie-dot   { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.pie-label { color:var(--text); flex:1; font-weight:500; }
.pie-val   { color:var(--accent); font-size:12px; }
.pie-pct   { color:var(--muted); font-size:11px; min-width:32px; text-align:right; }

/* ── Horizontal bar charts ── */
.bar-chart-wrap { display:flex; flex-direction:column; gap:10px; }
.bar-row { display:flex; align-items:center; gap:10px; }
.bar-label { font-size:11px; color:var(--muted); min-width:44px; flex-shrink:0; text-align:right; }
.bar-track {
  flex:1; height:14px; background:rgba(255,255,255,.06);
  border-radius:7px; overflow:hidden;
}
.bar-fill { height:100%; border-radius:7px; transition:width .5s ease; }
.bar-count { font-size:11px; color:var(--accent); min-width:20px; }

/* ── Pattern bars ── */
.pattern-bars { display:flex; flex-direction:column; gap:14px; }
.pat-row { display:flex; flex-direction:column; gap:5px; }
.pat-meta { display:flex; justify-content:space-between; align-items:center; }
.pat-label { font-size:12px; font-weight:600; color:var(--text); }
.pat-count { font-size:12px; color:var(--accent); }
.pat-track { height:10px; background:rgba(255,255,255,.06); border-radius:5px; overflow:hidden; }
.pat-fill  { height:100%; border-radius:5px; transition:width .5s ease; }
.pat-score-row { display:flex; justify-content:flex-end; gap:6px; font-size:10px; }
.pat-score-label { color:var(--muted); }

/* ── Line / scatter SVG ── */
.line-wrap { position:relative; }
.line-svg  { width:100%; height:auto; display:block; }

/* ── No data ── */
.no-data {
  text-align:center; padding:40px 20px; color:var(--muted); font-size:13px;
}

/* ── Section divider ── */
.section-divider {
  display:flex; align-items:baseline; gap:12px;
  padding: 12px 0 4px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}
.section-label {
  font-family:var(--font-mono); font-size:14px; font-weight:700;
  color:var(--accent);
}
.section-sub { font-size:12px; color:var(--muted); }

/* ── Threshold card ── */
.threshold-card { padding: 16px 22px; }
.threshold-row {
  display:flex; align-items:center; gap:16px; flex-wrap:wrap;
}
.thr-val {
  font-size:28px; font-weight:700; color:var(--accent); min-width:40px;
}
.thr-slider {
  flex:1; min-width:120px; max-width:320px;
  -webkit-appearance:none; height:6px; border-radius:3px;
  background:linear-gradient(to right, #7c3aed, #ef4444);
  outline:none; cursor:pointer;
}
.thr-slider::-webkit-slider-thumb {
  -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
  background:#c084fc; border:2px solid #07071a; cursor:pointer;
}
.thr-labels { display:flex; gap:16px; flex-wrap:wrap; }
.thr-cat { font-size:12px; font-weight:600; }

/* ── Key eval cards ── */
.eval-cards-row {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap:14px;
}
.eval-card {
  background:var(--surface); border:1px solid var(--border);
  border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:6px;
  transition:border-color .2s;
}
.eval-card:hover { border-color:rgba(124,58,237,.3); }
.eval-label { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.eval-value { font-size:24px; font-weight:700; }
.eval-desc  { font-size:10px; color:var(--muted); line-height:1.4; }
.eval-bar-track {
  height:3px; background:rgba(255,255,255,.06); border-radius:2px; overflow:hidden; margin-top:4px;
}
.eval-bar-fill { height:100%; border-radius:2px; transition:width .5s ease; }

/* ── Confusion Matrix ── */
.cm-wrap { display:flex; flex-direction:column; gap:12px; align-items:center; }
.cm-grid {
  display:grid; grid-template-columns:80px 1fr 1fr;
  grid-template-rows:auto auto auto;
  gap:6px; width:100%;
}
.cm-corner { background:transparent; }
.cm-col-label {
  font-size:10px; font-weight:700; color:var(--muted); text-align:center;
  padding:4px; font-family:var(--font-mono); text-transform:uppercase; letter-spacing:.04em;
}
.cm-row-label {
  font-size:10px; font-weight:700; color:var(--muted);
  display:flex; align-items:center; justify-content:flex-end; padding-right:8px;
  font-family:var(--font-mono); text-transform:uppercase; letter-spacing:.04em;
}
.cm-cell {
  border-radius:10px; padding:14px 10px; display:flex; flex-direction:column;
  align-items:center; gap:3px; border:1px solid transparent;
}
.cm-tp { background:rgba(34,197,94,0.12);  border-color:rgba(34,197,94,0.3); }
.cm-fn { background:rgba(239,68,68,0.10);  border-color:rgba(239,68,68,0.25); }
.cm-fp { background:rgba(249,115,22,0.10); border-color:rgba(249,115,22,0.25); }
.cm-tn { background:rgba(56,189,248,0.10); border-color:rgba(56,189,248,0.25); }
.cm-cell-label { font-size:10px; font-weight:700; color:var(--muted); }
.cm-tp .cm-cell-label { color:#22c55e; }
.cm-fn .cm-cell-label { color:#ef4444; }
.cm-fp .cm-cell-label { color:#f97316; }
.cm-tn .cm-cell-label { color:#38bdf8; }
.cm-cell-value { font-size:26px; font-weight:700; }
.cm-tp .cm-cell-value { color:#22c55e; }
.cm-fn .cm-cell-value { color:#ef4444; }
.cm-fp .cm-cell-value { color:#f97316; }
.cm-tn .cm-cell-value { color:#38bdf8; }
.cm-cell-sub { font-size:9px; color:var(--muted); }
.cm-note { font-size:10px; color:var(--muted); text-align:center; }

/* ── Metrics table ── */
.metrics-table-wrap { overflow-x:auto; }
.metrics-table {
  width:100%; border-collapse:collapse; font-size:12px;
}
.metrics-table th {
  font-family:var(--font-mono); font-size:10px; font-weight:700;
  color:var(--muted); text-transform:uppercase; letter-spacing:.04em;
  padding:6px 10px; border-bottom:1px solid var(--border); text-align:left;
}
.metrics-table td { padding:6px 10px; border-bottom:1px solid rgba(255,255,255,.04); }
.metric-name  { color:var(--text); font-weight:500; }
.metric-value { font-size:13px; font-weight:700; min-width:60px; }
.metric-formula { color:var(--muted); font-size:10px; font-family:var(--font-mono); }
.metrics-table tr:hover td { background:rgba(124,58,237,.06); }

/* ── Per-class ── */
.per-class-wrap { display:flex; flex-direction:column; gap:16px; }
.pcls-row { display:flex; flex-direction:column; gap:6px; }
.pcls-header { display:flex; justify-content:space-between; align-items:center; }
.pcls-name { font-size:12px; font-weight:700; }
.pcls-count { font-size:11px; color:var(--muted); }
.pcls-bars { display:flex; flex-direction:column; gap:4px; }
.pcls-bar-row { display:flex; align-items:center; gap:8px; }
.pcls-ml { font-size:10px; color:var(--muted); min-width:28px; font-family:var(--font-mono); }
.pcls-track { flex:1; height:8px; background:rgba(255,255,255,.06); border-radius:4px; overflow:hidden; }
.pcls-fill  { height:100%; border-radius:4px; transition:width .5s ease; }
.pcls-mv { font-size:10px; min-width:36px; text-align:right; }


/* ── Backend eval metric cards ── */
.beval-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}
.beval-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.beval-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
.beval-value { font-size: 22px; font-weight: 700; }
.beval-track { height: 3px; background: rgba(255,255,255,.06); border-radius: 2px; overflow: hidden; margin-top: 2px; }
.beval-fill  { height: 100%; border-radius: 2px; transition: width .5s ease; }

/* ── Absent notice ── */
.beval-absent {
  display: flex; align-items: center; gap: 10px;
  background: rgba(124,58,237,.06); border: 1px solid rgba(124,58,237,.15);
  border-radius: 12px; padding: 14px 18px; font-size: 13px; color: var(--muted);
}
.beval-absent code {
  background: rgba(124,58,237,.15); padding: 1px 6px; border-radius: 4px;
  font-family: var(--font-mono); font-size: 12px; color: var(--accent);
}

@media(max-width:640px){
  .charts-row { grid-template-columns:1fr; }
  .pie-wrap   { flex-direction:column; align-items:center; }
  .eval-cards-row { grid-template-columns: repeat(2, 1fr); }
  .cm-grid { grid-template-columns: 60px 1fr 1fr; }
}
</style>
