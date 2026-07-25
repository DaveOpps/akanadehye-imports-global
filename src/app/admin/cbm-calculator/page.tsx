"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";

/* ── constants ─────────────────────────────────────────────────────── */

type Unit = "cm" | "mm" | "m" | "inch" | "ft" | "yd";
type Pkg = { id: number; length: number; width: number; height: number; qty: number; unit: Unit; weight: number };

const toMeters: Record<Unit, number> = { cm: 0.01, mm: 0.001, m: 1, inch: 0.0254, ft: 0.3048, yd: 0.9144 };
const UNIT_LABEL: Record<Unit, string> = { cm: "cm", mm: "mm", m: "m", inch: "in", ft: "ft", yd: "yd" };
const fromCBM = { cft: 35.3147, cyd: 1.30795, cin: 61023.7 };

// Standard ocean-container loadable volumes (approx., ~usable), in CBM.
const CONTAINERS = [
  { name: "20ft Standard", cbm: 28 },
  { name: "40ft Standard", cbm: 58 },
  { name: "40ft High-Cube", cbm: 68 },
];

// Standalone quick converters (mirrors the CBM↔CFT/CYD/CIN tools).
const CONVERSIONS: Record<string, { label: string; from: string; to: string; factor: number; dec: number }> = {
  cbm_cft: { label: "CBM → Cubic Feet", from: "CBM", to: "CFT", factor: 35.3147, dec: 2 },
  cft_cbm: { label: "Cubic Feet → CBM", from: "CFT", to: "CBM", factor: 1 / 35.3147, dec: 4 },
  cbm_cyd: { label: "CBM → Cubic Yard", from: "CBM", to: "CYD", factor: 1.30795, dec: 3 },
  cbm_cin: { label: "CBM → Cubic Inch", from: "CBM", to: "CIN", factor: 61023.7, dec: 0 },
};

const DIM_FACTORS: Record<string, { label: string; value: number; note: string }> = {
  air_167: { label: "Air (IATA)", value: 167, note: "167 kg/m³" },
  air_6000: { label: "Air (6000)", value: 166.67, note: "LWH/6000" },
  sea: { label: "Sea / LCL", value: 1000, note: "1000 kg/m³" },
  express: { label: "Express", value: 200, note: "200 kg/m³" },
  custom: { label: "Custom", value: 167, note: "Your factor" },
};

// Approx. rates vs USD (GHS added for Akanadehye).
const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.25,
  JPY: 157, INR: 83.5, AED: 3.67, SGD: 1.35,
  HKD: 7.82, AUD: 1.53, CAD: 1.38, CHF: 0.88,
  KRW: 1380, MYR: 4.72, THB: 36.5, VND: 25400,
  PHP: 58.5, IDR: 16200, NZD: 1.67, SAR: 3.75,
  GHS: 15.8,
};

let nextId = 1;

function formatNum(n: number, decimals = 3): string {
  if (isNaN(n) || !isFinite(n)) return "0";
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(decimals);
}

function CargoBox({ length, width, height }: { length: number; width: number; height: number }) {
  const maxDim = Math.max(length, width, height, 0.001);
  const scale = 95 / maxDim;
  const bw = Math.max(width * scale, 34);
  const bh = Math.max(height * scale, 26);
  const bd = Math.max(length * scale, 24);
  return (
    <div
      className="cargo-box"
      style={{ width: bw, height: bh, ["--bw" as string]: bw + "px", ["--bh" as string]: bh + "px", ["--bd" as string]: bd + "px" } as React.CSSProperties}
    >
      <div className="face front" /><div className="face back" />
      <div className="face left" /><div className="face right" />
      <div className="face top" /><div className="face bottom" />
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */

export default function CbmCalculatorPage() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [packages, setPackages] = useState<Pkg[]>([
    { id: nextId++, length: 100, width: 80, height: 60, qty: 1, unit: "cm", weight: 25 },
  ]);
  const [dimKey, setDimKey] = useState("air_167");
  const [customFactor, setCustomFactor] = useState(167);
  const [ratePerKg, setRatePerKg] = useState(4.5);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [copied, setCopied] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [convType, setConvType] = useState("cbm_cft");
  const [convInput, setConvInput] = useState("");

  const dimFactor = dimKey === "custom" ? customFactor : DIM_FACTORS[dimKey].value;

  const results = useMemo(() => {
    let totalCBM = 0, totalActual = 0, totalPieces = 0;
    const details: { index: number; cbm: number; weight: number }[] = [];
    packages.forEach((p, i) => {
      const f = toMeters[p.unit] || 0.01;
      const vol = p.length * f * p.width * f * p.height * f * p.qty;
      totalCBM += vol;
      totalActual += p.weight || 0;
      totalPieces += p.qty;
      details.push({ index: i + 1, cbm: vol, weight: p.weight || 0 });
    });
    const volWeight = totalCBM * dimFactor;
    const volWeightSea = totalCBM * 1000; // sea/LCL: 1 CBM = 1000 kg
    const volWeightAir = totalCBM * 167; // air (IATA)
    const chargeable = Math.max(totalActual, volWeight);
    const costBase = chargeable * ratePerKg;
    const density = totalCBM > 0 ? totalActual / totalCBM : 0;
    return {
      totalCBM, totalActual, totalPieces, details,
      cft: totalCBM * fromCBM.cft,
      cyd: totalCBM * fromCBM.cyd,
      cin: totalCBM * fromCBM.cin,
      volWeight, volWeightSea, volWeightAir, chargeable, costBase, density,
      isVolHigher: volWeight > totalActual,
    };
  }, [packages, dimFactor, ratePerKg]);

  const ringOffset = useMemo(() => {
    const circ = 2 * Math.PI * 42;
    return circ * (1 - Math.min(results.totalCBM / 8, 1));
  }, [results.totalCBM]);

  const converted = useMemo(() => {
    const baseRate = RATES[baseCurrency] || 1;
    const inUSD = results.costBase / baseRate;
    return Object.entries(RATES).map(([code, rate]) => ({ code, amount: inUSD * rate }));
  }, [results.costBase, baseCurrency]);

  const activePkg = packages[selectedPkg] || packages[0];

  // Single-carton volume of the active package (for container-fit estimates).
  const activeCartonCBM = activePkg
    ? activePkg.length * toMeters[activePkg.unit] * activePkg.width * toMeters[activePkg.unit] * activePkg.height * toMeters[activePkg.unit]
    : 0;

  const conv = CONVERSIONS[convType];
  const convResult = (parseFloat(convInput) || 0) * conv.factor;

  const updatePkg = (id: number, field: keyof Pkg, value: number | string) => {
    setPackages((pkgs) => pkgs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const addPackage = () => {
    setPackages((pkgs) => [...pkgs, { id: nextId++, length: 50, width: 40, height: 30, qty: 1, unit: "cm", weight: 10 }]);
    setSelectedPkg(packages.length);
  };
  const removePackage = (id: number) => {
    if (packages.length <= 1) return;
    setPackages((pkgs) => pkgs.filter((p) => p.id !== id));
    setSelectedPkg(0);
  };

  const copyResults = () => {
    const lines = [
      `CBM Calculator – Akanadehye Imports Global`,
      `Date: ${new Date().toLocaleString()}`,
      `Packages: ${packages.length} type(s) | Pieces: ${results.totalPieces}`,
      `Total CBM: ${formatNum(results.totalCBM, 3)}`,
      `CFT: ${formatNum(results.cft, 2)} | CYD: ${formatNum(results.cyd, 3)}`,
      `Actual Weight: ${formatNum(results.totalActual, 1)} kg`,
      `Volumetric (Sea): ${formatNum(results.volWeightSea, 1)} kg | (Air): ${formatNum(results.volWeightAir, 1)} kg`,
      `Chargeable Weight: ${formatNum(results.chargeable, 1)} kg (${DIM_FACTORS[dimKey].label})`,
      `Packing Density: ${formatNum(results.density, 1)} kg/m³`,
      `Est. Cost: ${formatNum(results.costBase, 2)} ${baseCurrency}`,
      `Approx. cartons (Pkg ${selectedPkg + 1}, ${formatNum(activeCartonCBM, 3)} CBM/box): ` +
        CONTAINERS.map((c) => `${c.name} ${activeCartonCBM > 0 ? Math.floor(c.cbm / activeCartonCBM) : 0}`).join(" · "),
      ``,
      ...packages.map((p, i) => `Pkg ${i + 1}: ${p.length}×${p.width}×${p.height} ${p.unit} ×${p.qty} → ${formatNum(results.details[i].cbm, 3)} CBM, ${p.weight} kg`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const printPDF = () => window.print();

  useEffect(() => { /* theme is applied on the wrapper via data-theme */ }, [theme]);

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Calculators" }, { label: "CBM Calculator" }]}
        title="CBM Calculator"
        subtitle="Cubic metres, volumetric/chargeable weight, density & freight cost for multi-package shipments."
      />

      <div className="cbm-root" data-theme={theme}>
        <style dangerouslySetInnerHTML={{ __html: CBM_CSS }} />
        <div className="bg-grid" />
        <div className="bg-glow" />
        <div className="cbm-inner">
          <header>
            <div className="logo">
              <div className="logo-mark">CBM</div>
              <div className="logo-text">
                <span>Cubic Meter</span>
                <small>Multi-Package Goods Calculator</small>
              </div>
            </div>
            <div className="header-actions">
              <button className="theme-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
                {theme === "dark" ? "☀ Light" : "☾ Dark"}
              </button>
              <button className="print-btn" onClick={printPDF}>🖨 Print / PDF</button>
            </div>
          </header>

          <main>
            {/* Inputs */}
            <section className="panel inputs-panel">
              <h2>Packages<span style={{ fontSize: 9, color: "var(--accent)" }}>{packages.length} type(s)</span></h2>

              {packages.map((pkg, idx) => (
                <div key={pkg.id} className="pkg-card" style={{ outline: selectedPkg === idx ? "1.5px solid var(--accent)" : "none" }} onClick={() => setSelectedPkg(idx)}>
                  <div className="pkg-header">
                    <span className="pkg-title">Package {idx + 1}</span>
                    {packages.length > 1 && (
                      <button className="pkg-remove" onClick={(e) => { e.stopPropagation(); removePackage(pkg.id); }}>×</button>
                    )}
                  </div>
                  <div className="field-row">
                    <div><div className="mini-label">Length</div><input type="number" value={pkg.length} min="0" step="any" onChange={(e) => updatePkg(pkg.id, "length", parseFloat(e.target.value) || 0)} /></div>
                    <div><div className="mini-label">Width</div><input type="number" value={pkg.width} min="0" step="any" onChange={(e) => updatePkg(pkg.id, "width", parseFloat(e.target.value) || 0)} /></div>
                    <div><div className="mini-label">Height</div><input type="number" value={pkg.height} min="0" step="any" onChange={(e) => updatePkg(pkg.id, "height", parseFloat(e.target.value) || 0)} /></div>
                    <div>
                      <div className="mini-label">Unit</div>
                      <select value={pkg.unit} onChange={(e) => updatePkg(pkg.id, "unit", e.target.value)}>
                        <option value="cm">cm</option><option value="mm">mm</option><option value="inch">in</option>
                        <option value="ft">ft</option><option value="yd">yd</option><option value="m">m</option>
                      </select>
                    </div>
                  </div>
                  <div className="field-row qty-row">
                    <div><div className="mini-label">Quantity</div><input type="number" value={pkg.qty} min="1" step="1" onChange={(e) => updatePkg(pkg.id, "qty", parseFloat(e.target.value) || 1)} /></div>
                    <div><div className="mini-label">Weight (kg)</div><input type="number" value={pkg.weight} min="0" step="any" onChange={(e) => updatePkg(pkg.id, "weight", parseFloat(e.target.value) || 0)} /></div>
                  </div>
                </div>
              ))}

              <button className="add-btn" onClick={addPackage}>+ Add Package Type</button>

              <div className="section-divider" />
              <h2>Dimensional Factor</h2>
              <div className="dim-factor-row">
                {Object.entries(DIM_FACTORS).map(([key, f]) => (
                  <div key={key} className={`chip ${dimKey === key ? "active" : ""}`} onClick={() => setDimKey(key)}>
                    {f.label}<small>{f.note}</small>
                  </div>
                ))}
              </div>
              {dimKey === "custom" && (
                <div style={{ marginTop: 6 }}>
                  <div className="mini-label">Custom Factor (kg/m³)</div>
                  <input type="number" value={customFactor} min="1" step="any" onChange={(e) => setCustomFactor(parseFloat(e.target.value) || 167)} />
                </div>
              )}

              <div className="section-divider" />
              <h2>Freight Rate</h2>
              <div className="field-row qty-row">
                <div><div className="mini-label">Rate per kg</div><input type="number" value={ratePerKg} min="0" step="any" onChange={(e) => setRatePerKg(parseFloat(e.target.value) || 0)} /></div>
                <div>
                  <div className="mini-label">Currency</div>
                  <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
                    {Object.keys(RATES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="section-divider" />
              <h2>Quick Converter</h2>
              <select value={convType} onChange={(e) => setConvType(e.target.value)} style={{ marginBottom: 6 }}>
                {Object.entries(CONVERSIONS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
              <div className="field-row qty-row">
                <div>
                  <div className="mini-label">{conv.from}</div>
                  <input type="number" value={convInput} min="0" step="any" placeholder="0" onChange={(e) => setConvInput(e.target.value)} />
                </div>
                <div>
                  <div className="mini-label">{conv.to}</div>
                  <div className="conv-out">{formatNum(convResult, conv.dec)}</div>
                </div>
              </div>
            </section>

            {/* Visual */}
            <section className="panel visual-panel">
              <div className="visual-header">
                <span>Live Preview</span>
                <div className="dims-label">{activePkg ? `${activePkg.length}×${activePkg.width}×${activePkg.height} ${UNIT_LABEL[activePkg.unit]}` : "—"}</div>
              </div>
              <div className="stage">
                {activePkg && <CargoBox length={activePkg.length} width={activePkg.width} height={activePkg.height} />}
                <div className="floor-shadow" />
              </div>
              <div className="volume-ring">
                <svg viewBox="0 0 100 100">
                  <circle className="ring-bg" cx="50" cy="50" r="42" />
                  <circle className="ring-progress" cx="50" cy="50" r="42" style={{ strokeDashoffset: ringOffset, strokeDasharray: 264 }} />
                </svg>
                <div className="ring-value"><span>{formatNum(results.totalCBM, 2)}</span><small>Total CBM</small></div>
              </div>
              <div className="pkg-summary">{packages.length} package type(s) · {results.totalPieces} piece(s)</div>
            </section>

            {/* Results */}
            <section className="panel results-panel">
              <h2>Results</h2>
              <div className="result-card primary">
                <div className="result-label">Total Volume</div>
                <div className="result-value">{formatNum(results.totalCBM, 3)}</div>
                <div className="result-unit">Cubic Meters (CBM)</div>
              </div>
              <div className="conversions">
                <div className="conv-item"><span className="conv-label">Cubic Feet</span><span className="conv-value">{formatNum(results.cft, 2)}</span><span className="conv-unit">CFT</span></div>
                <div className="conv-item"><span className="conv-label">Cubic Yards</span><span className="conv-value">{formatNum(results.cyd, 3)}</span><span className="conv-unit">CYD</span></div>
                <div className="conv-item"><span className="conv-label">Cubic Inches</span><span className="conv-value">{formatNum(results.cin, 0)}</span><span className="conv-unit">CIN</span></div>
              </div>

              <div className="weight-card">
                <div className="weight-row"><span>Actual Weight</span><strong>{formatNum(results.totalActual, 1)} kg</strong></div>
                <div className="weight-row"><span>Volumetric — Sea (÷1000)</span><strong>{formatNum(results.volWeightSea, 1)} kg</strong></div>
                <div className="weight-row"><span>Volumetric — Air (167)</span><strong>{formatNum(results.volWeightAir, 1)} kg</strong></div>
                <div className="weight-row"><span>Volumetric — {DIM_FACTORS[dimKey].label}</span><strong>{formatNum(results.volWeight, 1)} kg</strong></div>
                <div className={`weight-row highlight ${results.isVolHigher ? "warn" : ""}`}><span>Chargeable Weight</span><strong>{formatNum(results.chargeable, 1)} kg</strong></div>
                {results.isVolHigher && <div style={{ fontSize: 8, color: "var(--warn)", marginTop: 3 }}>Charged by volume (DIM higher)</div>}
              </div>

              <div className="density-card">
                <div className="density-row"><span>Packing Density</span><strong>{formatNum(results.density, 1)} kg/m³</strong></div>
                <div className="density-row"><span>Total Pieces</span><strong>{results.totalPieces}</strong></div>
                <div style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 3 }}>
                  {results.density < 150 ? "Light / bulky goods" : results.density < 300 ? "Medium density" : "Dense / heavy goods"}
                </div>
              </div>

              <div className="weight-card">
                <div className="weight-row" style={{ color: "var(--accent)", fontWeight: 600 }}>
                  <span>Approx. Cartons — Package {selectedPkg + 1}</span>
                  <strong style={{ color: "var(--text-dim)" }}>{formatNum(activeCartonCBM, 3)} CBM/box</strong>
                </div>
                {CONTAINERS.map((c) => (
                  <div className="weight-row" key={c.name}>
                    <span>{c.name} <span style={{ opacity: 0.6 }}>({c.cbm} CBM)</span></span>
                    <strong>{activeCartonCBM > 0 ? Math.floor(c.cbm / activeCartonCBM).toLocaleString() : 0}</strong>
                  </div>
                ))}
                <div style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 3 }}>Boxes of the selected package per container (approx. loadable volume)</div>
              </div>

              <div className="cost-section">
                <h3>Estimated Freight Cost</h3>
                <div className="result-card primary" style={{ marginBottom: 6, padding: "9px" }}>
                  <div className="result-value" style={{ fontSize: 20 }}>{formatNum(results.costBase, 2)}</div>
                  <div className="result-unit">{baseCurrency}</div>
                </div>
                <div className="currency-grid">
                  {converted.filter((c) => c.code !== baseCurrency).slice(0, 9).map((c) => (
                    <div className="curr-item" key={c.code}><div className="code">{c.code}</div><div className="amount">{formatNum(c.amount, c.amount >= 1000 ? 0 : 2)}</div></div>
                  ))}
                </div>
              </div>

              <button className="copy-btn" onClick={copyResults}>{copied ? "✓ Copied" : "Copy Results"}</button>
              <button className="print-action" onClick={printPDF}>Print / Save as PDF</button>
            </section>
          </main>

          <footer>Multi-Package CBM · CFT/CYD/CIN · Sea &amp; Air Volumetric · Container Cartons · Quick Converters · 20+ Currencies</footer>
        </div>
      </div>
    </div>
  );
}

/* ── scoped styles (everything nested under .cbm-root so nothing leaks) ── */

const CBM_CSS = `
.cbm-root, .cbm-root[data-theme="dark"] {
  --bg: #0b0f1a; --panel: rgba(18,24,38,0.82); --panel-border: rgba(255,255,255,0.08);
  --accent: #d4a951; --accent-dim: rgba(212,169,81,0.15); --accent-glow: rgba(212,169,81,0.4);
  --text: #e8eef7; --text-dim: #8b9bb4; --warn: #ffb347; --danger: #ff6b6b;
  --input-bg: rgba(0,0,0,0.4); --card-bg: rgba(0,0,0,0.28);
  --radius: 14px; --font: 'Outfit', system-ui, sans-serif; --mono: 'JetBrains Mono', ui-monospace, monospace;
}
.cbm-root[data-theme="light"] {
  --bg: #f0f4f8; --panel: rgba(255,255,255,0.9); --panel-border: rgba(0,0,0,0.08);
  --accent: #a67c1a; --accent-dim: rgba(212,169,81,0.12); --accent-glow: rgba(212,169,81,0.25);
  --text: #1a2332; --text-dim: #5a6a7e; --warn: #e67e22; --danger: #e74c3c;
  --input-bg: rgba(0,0,0,0.04); --card-bg: rgba(0,0,0,0.03);
}
.cbm-root { position: relative; overflow: hidden; border-radius: 16px; margin-top: 4px;
  background: var(--bg); color: var(--text); font-family: var(--font); min-height: 78vh; }
.cbm-root * { margin: 0; padding: 0; box-sizing: border-box; }
.cbm-root .bg-grid { position: absolute; inset: 0;
  background-image: linear-gradient(rgba(128,128,128,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.06) 1px, transparent 1px);
  background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%); pointer-events: none; z-index: 0; }
.cbm-root .bg-glow { position: absolute; width: 600px; height: 600px; top: -180px; right: -120px;
  background: radial-gradient(circle, var(--accent-glow), transparent 65%); pointer-events: none; z-index: 0; opacity: 0.6; }
.cbm-root .cbm-inner { position: relative; z-index: 5; display: flex; flex-direction: column; }
.cbm-root header { padding: 18px 22px 6px; display: flex; align-items: center; justify-content: space-between; }
.cbm-root .logo { display: flex; align-items: center; gap: 12px; }
.cbm-root .logo-mark { width: 40px; height: 40px; background: linear-gradient(135deg, var(--accent), #0a1628); color: #fff !important;
  border-radius: 11px; display: grid; place-items: center; font-weight: 700; font-size: 11px; color: #041510; box-shadow: 0 0 18px var(--accent-glow); }
.cbm-root .logo-text span { display: block; font-weight: 600; font-size: 15px; }
.cbm-root .logo-text small { font-size: 10px; color: var(--text-dim); }
.cbm-root .header-actions { display: flex; gap: 8px; align-items: center; }
.cbm-root .theme-btn, .cbm-root .print-btn { background: var(--card-bg); border: 1px solid var(--panel-border);
  border-radius: 8px; padding: 7px 12px; color: var(--text); font-family: var(--font); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s; }
.cbm-root .theme-btn:hover, .cbm-root .print-btn:hover { border-color: var(--accent); color: var(--accent); }
.cbm-root main { display: grid; grid-template-columns: 340px minmax(0,1fr) 300px; gap: 16px; padding: 8px 22px 24px; width: 100%; align-items: start; }
.cbm-root .panel { background: var(--panel); border: 1px solid var(--panel-border); border-radius: var(--radius);
  backdrop-filter: blur(16px); padding: 16px; box-shadow: 0 6px 24px rgba(0,0,0,0.15); animation: cbmFadeUp 0.35s ease both; }
.cbm-root .inputs-panel { max-height: calc(100vh - 120px); overflow-y: auto; }
@keyframes cbmFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.cbm-root .panel h2 { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.1px; color: var(--text-dim);
  margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.cbm-root .pkg-card { background: var(--card-bg); border: 1px solid var(--panel-border); border-radius: 9px; padding: 10px; margin-bottom: 8px; cursor: pointer; transition: outline 0.15s; }
.cbm-root .pkg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.cbm-root .pkg-title { font-size: 11px; font-weight: 600; color: var(--accent); }
.cbm-root .pkg-remove { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 15px; line-height: 1; opacity: 0.6; }
.cbm-root .pkg-remove:hover { opacity: 1; }
.cbm-root .field-row { display: grid; grid-template-columns: 1fr 1fr 1fr 65px; gap: 5px; margin-bottom: 5px; }
.cbm-root .field-row.qty-row { grid-template-columns: 1fr 70px; }
.cbm-root .mini-label { font-size: 9px; color: var(--text-dim); margin-bottom: 2px; }
.cbm-root input, .cbm-root select { background: var(--input-bg); border: 1px solid var(--panel-border); border-radius: 6px;
  padding: 6px 7px; color: var(--text); font-size: 12px; outline: none; width: 100%; font-family: var(--mono); transition: border-color 0.15s; }
.cbm-root input:focus, .cbm-root select:focus { border-color: var(--accent); }
.cbm-root select { font-family: var(--font); cursor: pointer; }
.cbm-root .conv-out { background: var(--accent-dim); border: 1px solid var(--accent); border-radius: 6px; padding: 6px 7px; color: var(--accent); font-family: var(--mono); font-size: 12px; font-weight: 700; text-align: right; }
.cbm-root .add-btn { width: 100%; background: var(--accent-dim); border: 1px dashed var(--accent); border-radius: 8px; padding: 8px;
  color: var(--accent); font-family: var(--font); font-weight: 600; font-size: 12px; cursor: pointer; margin-top: 2px; transition: all 0.15s; }
.cbm-root .add-btn:hover { background: rgba(212,169,81,0.22); }
.cbm-root .section-divider { height: 1px; background: var(--panel-border); margin: 12px 0 10px; }
.cbm-root .dim-factor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.cbm-root .chip { background: var(--card-bg); border: 1px solid var(--panel-border); border-radius: 6px; padding: 6px 4px;
  font-size: 10px; text-align: center; cursor: pointer; transition: all 0.15s; color: var(--text-dim); }
.cbm-root .chip.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); font-weight: 600; }
.cbm-root .chip small { display: block; font-size: 8px; opacity: 0.7; margin-top: 1px; }
.cbm-root .visual-panel { display: flex; flex-direction: column; align-items: center; min-height: 380px; overflow: hidden; }
.cbm-root .visual-header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.cbm-root .visual-header span { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); }
.cbm-root .dims-label { font-family: var(--mono); font-size: 10px; color: var(--accent); background: var(--accent-dim); padding: 2px 7px; border-radius: 4px; }
.cbm-root .stage { position: relative; width: 220px; height: 190px; perspective: 900px; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
.cbm-root .cargo-box { position: relative; transform-style: preserve-3d; transform: rotateX(-24deg) rotateY(35deg);
  transition: width 0.4s cubic-bezier(0.34,1.3,0.64,1), height 0.4s cubic-bezier(0.34,1.3,0.64,1); animation: cbmFloat 5.5s ease-in-out infinite; }
@keyframes cbmFloat { 0%,100% { transform: rotateX(-24deg) rotateY(35deg) translateY(0); } 50% { transform: rotateX(-24deg) rotateY(35deg) translateY(-9px); } }
.cbm-root .face { position: absolute; border: 1.5px solid rgba(212,169,81,0.5); background: linear-gradient(145deg, rgba(212,169,81,0.22), rgba(0,70,55,0.08)); }
.cbm-root[data-theme="light"] .face { border-color: rgba(212,169,81,0.45); background: linear-gradient(145deg, rgba(212,169,81,0.18), rgba(0,100,80,0.06)); }
.cbm-root .front { width:100%; height:100%; transform: translateZ(calc(var(--bd)/2)); }
.cbm-root .back { width:100%; height:100%; transform: rotateY(180deg) translateZ(calc(var(--bd)/2)); }
.cbm-root .left { width:var(--bd); height:100%; transform: rotateY(-90deg) translateZ(calc(var(--bw)/2)); left:calc((100% - var(--bd))/2); }
.cbm-root .right { width:var(--bd); height:100%; transform: rotateY(90deg) translateZ(calc(var(--bw)/2)); left:calc((100% - var(--bd))/2); }
.cbm-root .top { width:100%; height:var(--bd); transform: rotateX(90deg) translateZ(calc(var(--bh)/2)); top:calc((100% - var(--bd))/2); }
.cbm-root .bottom { width:100%; height:var(--bd); transform: rotateX(-90deg) translateZ(calc(var(--bh)/2)); top:calc((100% - var(--bd))/2); }
.cbm-root .floor-shadow { position: absolute; bottom: 16px; width: 120px; height: 22px;
  background: radial-gradient(ellipse, var(--accent-glow), transparent 70%); border-radius: 50%; filter: blur(6px); animation: cbmShadowPulse 5.5s ease-in-out infinite; }
@keyframes cbmShadowPulse { 0%,100% { transform: scale(1); opacity: 0.65; } 50% { transform: scale(0.85); opacity: 0.3; } }
.cbm-root .volume-ring { position: relative; width: 92px; height: 92px; margin-top: 2px; }
.cbm-root .volume-ring svg { width:100%; height:100%; transform: rotate(-90deg); }
.cbm-root .ring-bg { fill:none; stroke: rgba(128,128,128,0.15); stroke-width: 6; }
.cbm-root .ring-progress { fill:none; stroke: var(--accent); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 264;
  transition: stroke-dashoffset 0.6s cubic-bezier(0.34,1.2,0.64,1); filter: drop-shadow(0 0 5px var(--accent-glow)); }
.cbm-root .ring-value { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cbm-root .ring-value span { font-family: var(--mono); font-size: 15px; font-weight: 500; color: var(--accent); }
.cbm-root .ring-value small { font-size: 8px; color: var(--text-dim); }
.cbm-root .pkg-summary { width: 100%; margin-top: 8px; font-size: 10px; color: var(--text-dim); text-align: center; }
.cbm-root .result-card.primary { background: linear-gradient(145deg, var(--accent-dim), transparent); border: 1px solid rgba(212,169,81,0.25);
  border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 10px; }
.cbm-root .result-label { font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
.cbm-root .result-value { font-family: var(--mono); font-size: 26px; font-weight: 600; color: var(--accent); line-height: 1.1; }
.cbm-root .result-unit { font-size: 10px; color: var(--text-dim); margin-top: 2px; }
.cbm-root .conversions { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.cbm-root .conv-item { display: grid; grid-template-columns: 1fr auto auto; gap: 4px; align-items: center; background: var(--card-bg); border-radius: 7px; padding: 7px 9px; }
.cbm-root .conv-label { font-size: 10px; color: var(--text-dim); }
.cbm-root .conv-value { font-family: var(--mono); font-size: 11px; font-weight: 500; }
.cbm-root .conv-unit { font-size: 8px; color: var(--accent); font-weight: 600; min-width: 26px; text-align: right; }
.cbm-root .weight-card, .cbm-root .density-card { background: var(--card-bg); border-radius: 8px; padding: 9px; border: 1px solid var(--panel-border); margin-bottom: 8px; }
.cbm-root .weight-row, .cbm-root .density-row { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-dim); margin-bottom: 4px; }
.cbm-root .weight-row:last-child, .cbm-root .density-row:last-child { margin-bottom: 0; }
.cbm-root .weight-row strong, .cbm-root .density-row strong { color: var(--text); font-family: var(--mono); font-weight: 500; }
.cbm-root .weight-row.highlight strong { color: var(--accent); font-size: 12px; }
.cbm-root .weight-row.warn strong { color: var(--warn); }
.cbm-root .cost-section { border-top: 1px solid var(--panel-border); padding-top: 8px; margin-top: 2px; }
.cbm-root .cost-section h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.9px; color: var(--text-dim); margin-bottom: 6px; font-weight: 500; }
.cbm-root .currency-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-top: 5px; }
.cbm-root .curr-item { background: var(--card-bg); border-radius: 6px; padding: 5px 6px; }
.cbm-root .curr-item .code { font-size: 8px; color: var(--text-dim); }
.cbm-root .curr-item .amount { font-family: var(--mono); font-size: 11px; font-weight: 500; margin-top: 1px; }
.cbm-root .copy-btn, .cbm-root .print-action { width: 100%; margin-top: 8px; background: var(--accent-dim); border: 1px solid rgba(212,169,81,0.3);
  border-radius: 8px; padding: 8px; color: var(--accent); font-family: var(--font); font-weight: 600; font-size: 11px; cursor: pointer; transition: all 0.15s; }
.cbm-root .copy-btn:hover, .cbm-root .print-action:hover { background: rgba(212,169,81,0.22); }
.cbm-root footer { text-align: center; padding: 4px 14px 16px; font-size: 10px; color: var(--text-dim); opacity: 0.45; }
@media (max-width: 1180px) {
  .cbm-root main { grid-template-columns: 1fr; }
  .cbm-root .visual-panel { order: -1; min-height: 300px; }
  .cbm-root .inputs-panel { max-height: none; }
  .cbm-root .currency-grid { grid-template-columns: 1fr 1fr; }
}
`;
