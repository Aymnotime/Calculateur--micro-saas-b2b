"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext
} from "chart.js";

// --- Configuration Chart.js "Enterprise Grade" ---
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Chart = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { 
  ssr: false,
  loading: () => <div className="h-64 w-full flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-widest">Initialisation...</div>
});

// --- Types & Default Data ---
type ProductData = {
  id: number;
  name: string;
  prixVente: number;
  coutAchat: number;
  coutExpedition: number;
  fraisPlateformePct: number;
  fraisPlateformeFixe: number;
  fraisPaiementPct: number;
  fraisPaiementFixe: number;
  cpa: number;
};

const defaultInputs: ProductData = {
  id: 0,
  name: "Produit A",
  prixVente: 49.00,
  coutAchat: 12.50,
  coutExpedition: 4.50,
  fraisPlateformePct: 15.00,
  fraisPlateformeFixe: 0.00,
  fraisPaiementPct: 1.50,
  fraisPaiementFixe: 0.25,
  cpa: 12.00,
};

// --- Moteur de Calcul ---
function calculateMetrics(data: ProductData) {
  const cogs = data.coutAchat + data.coutExpedition;
  const feesPlatform = data.prixVente * (data.fraisPlateformePct / 100) + data.fraisPlateformeFixe;
  const feesPayment = data.prixVente * (data.fraisPaiementPct / 100) + data.fraisPaiementFixe;
  const totalFees = feesPlatform + feesPayment;
  
  const totalCost = cogs + totalFees + data.cpa;
  const netProfit = data.prixVente - totalCost;
  const netProfitPct = data.prixVente > 0 ? (netProfit / data.prixVente) * 100 : 0;
  
  // Point mort simplifié
  const breakEvenPrice = totalCost; 
  const roas = data.cpa > 0 ? data.prixVente / data.cpa : 0;

  return { cogs, totalFees, totalCost, netProfit, netProfitPct, breakEvenPrice, roas };
}

// --- Composants UI "Financial Ledger Style" ---

// Input optimisé pour la finance : Alignement droite, Tabular Nums, Design compact
const FinancialInput = ({ 
  label, 
  value, 
  onChange, 
  prefix, 
  suffix,
  step = 0.01 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  prefix?: string; 
  suffix?: string;
  step?: number;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors px-1 -mx-1 rounded">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer flex-1">
      {label}
    </label>
    <div className="relative flex items-center w-28">
      {prefix && <span className="absolute left-0 text-slate-400 text-xs font-medium pl-2">{prefix}</span>}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded text-right text-sm font-bold text-slate-900 tabular-nums outline-none transition-all py-1 ${prefix ? 'pl-6' : 'pl-2'} ${suffix ? 'pr-6' : 'pr-2'}`}
      />
      {suffix && <span className="absolute right-0 text-slate-400 text-xs font-medium pr-2">{suffix}</span>}
    </div>
  </div>
);

const KPICard = ({ title, value, subValue, trend }: { title: string, value: string, subValue?: string, trend?: 'up' | 'down' | 'neutral' }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 transition-all">
    <div className="flex justify-between items-start mb-2">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
      {trend && (
        <span className={`w-2 h-2 rounded-full ${trend === 'up' ? 'bg-emerald-500' : trend === 'down' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
      )}
    </div>
    <div>
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight group-hover:text-indigo-900 transition-colors">{value}</div>
      {subValue && <div className="text-xs font-medium text-slate-500 mt-1">{subValue}</div>}
    </div>
  </div>
);

// --- Main Component ---
export default function EnterpriseProfitCalculator() {
  const [product, setProduct] = useState<ProductData>({ ...defaultInputs, id: Date.now() });
  const metrics = calculateMetrics(product);

  const handleUpdate = (field: keyof ProductData, value: number) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  // Chart Logic Optimisée : Centrage mathématique parfait
  const chartData = useMemo(() => {
    const range = 20; 
    const step = 2; 
    // On veut que le prix actuel soit l'index 10 (le milieu de 21 points)
    // Donc start = prixVente - (10 * step)
    const pointsBefore = 10;
    const startPrice = product.prixVente - (pointsBefore * step);
    
    const labels = [];
    const margins = [];

    for (let i = 0; i <= 20; i++) {
      const p = startPrice + (i * step);
      labels.push(p);
      const m = calculateMetrics({ ...product, prixVente: p });
      margins.push(m.netProfit);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Marge Nette',
          data: margins,
          borderColor: '#0f172a', // Slate 900
          borderWidth: 2,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(15, 23, 42, 0.08)");
            gradient.addColorStop(1, "rgba(15, 23, 42, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          yAxisID: 'y',
        }
      ]
    };
  }, [product]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: any) => `Prix : ${items[0].label}€`,
          label: (item: any) => `Marge nette : ${Number(item.raw).toFixed(2)}€`,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10, family: 'sans-serif' }, callback: (v: any) => v + '€' }
      },
      x: {
        grid: { display: false },
        ticks: { display: true, color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 6 }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
      
      {/* --- Enterprise Header --- */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-slate-900/20">PE</div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Profit Engine <span className="text-slate-400 font-normal ml-1">Enterprise</span></h1>
            </div>
           
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition px-3 py-2">Réinitialiser</button>
            <button className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm hover:shadow">
              Export PDF
            </button>
            <button className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-md shadow-slate-900/10">
              Enregistrer
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* --- High-Level KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard 
            title="Marge Nette / Unité" 
            value={`${metrics.netProfit.toFixed(2)}€`} 
            subValue={`${metrics.netProfitPct.toFixed(1)}% du prix de vente`}
            trend={metrics.netProfitPct > 15 ? 'up' : 'down'}
          />
          <KPICard 
            title="ROAS Cible" 
            value={`${metrics.roas.toFixed(2)}x`} 
            subValue="Seuil min. recommandé : 3.0x"
            trend={metrics.roas > 3 ? 'up' : 'down'}
          />
          <KPICard 
            title="Coût Total" 
            value={`${metrics.totalCost.toFixed(2)}€`} 
            subValue="COGS + OpEx + Marketing"
            trend='neutral'
          />
          <KPICard 
            title="Seuil de Rentabilité" 
            value={`${metrics.breakEvenPrice.toFixed(2)}€`} 
            subValue="Prix plancher pour marge nulle"
            trend='neutral'
          />
        </div>

        {/* --- Main Grid Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT: Control Ledger (Inputs) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Module Revenus */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Revenus
                </h3>
              </div>
              <div className="p-5 pt-2">
                <FinancialInput label="Prix de Vente TTC" value={product.prixVente} onChange={v => handleUpdate('prixVente', v)} prefix="€" />
              </div>
            </section>

            {/* Module COGS */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Coûts Directs
                </h3>
              </div>
              <div className="p-5 pt-2">
                <FinancialInput label="Coût d'achat" value={product.coutAchat} onChange={v => handleUpdate('coutAchat', v)} prefix="€" />
                <FinancialInput label="Logistique & Port" value={product.coutExpedition} onChange={v => handleUpdate('coutExpedition', v)} prefix="€" />
              </div>
            </section>

            {/* Module OpEx */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Opérationnel
                </h3>
              </div>
              <div className="p-5 pt-2">
                <FinancialInput label="Com. Plateforme" value={product.fraisPlateformePct} onChange={v => handleUpdate('fraisPlateformePct', v)} suffix="%" />
                <FinancialInput label="Fixe Plateforme" value={product.fraisPlateformeFixe} onChange={v => handleUpdate('fraisPlateformeFixe', v)} prefix="€" />
                <FinancialInput label="Com. Paiement" value={product.fraisPaiementPct} onChange={v => handleUpdate('fraisPaiementPct', v)} suffix="%" />
                <FinancialInput label="Fixe Paiement" value={product.fraisPaiementFixe} onChange={v => handleUpdate('fraisPaiementFixe', v)} prefix="€" />
                <div className="mt-4 pt-2 border-t border-slate-100">
                   <FinancialInput label="CPA (Marketing)" value={product.cpa} onChange={v => handleUpdate('cpa', v)} prefix="€" />
                </div>
              </div>
            </section>

          </div>

          {/* --- RIGHT: Visualization & Intelligence --- */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            
            {/* Intelligence Bar */}
            <div className="bg-white border-l-4 border-slate-800 rounded-r-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">Analyse de sensibilité</h3>
                <p className="text-sm text-slate-600 font-medium">
                  {metrics.netProfitPct < 15 
                    ? "Marge sous pression. Une augmentation du prix de 2€ augmenterait votre net de +15%."
                    : "Structure saine. Vous disposez d'une marge de manœuvre pour augmenter le budget marketing."}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ratio d'efficience</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{(metrics.netProfit / metrics.totalCost * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Projection Financière</h3>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Net Profit Sensitivity Analysis</p>
                </div>
                
                {/* Légende Custom Pro */}
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-900 rounded-full"></span> Marge Nette
                   </div>
                   <div className="flex items-center gap-2 opacity-50">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span> Seuil critique
                   </div>
                </div>
              </div>
              
              <div className="flex-1 w-full relative min-h-[350px]">
                {/* CSS-only Dotted Line Overlay for absolute precision */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-slate-300 z-0 pointer-events-none"></div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                   Actuel ({product.prixVente}€)
                </div>
                
                <Chart data={chartData} options={chartOptions as any} />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}