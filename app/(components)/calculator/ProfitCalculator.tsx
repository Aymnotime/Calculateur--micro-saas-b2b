"use client";

import { useState, useRef } from "react";
import InputPanel from "./InputPanel";
import ProfitDashboard from "./ProfitDashboard";

import { Line } from "react-chartjs-2";

import { Chart as ChartJS, LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Title, Tooltip, Legend);

const defaultInputs = {
  id: "init", // Ajout d'un ID pour la stabilité React
  prixVente: 49,
  coutAchat: 20,
  coutExpedition: 5,
  fraisPlateformePct: 2.5,
  fraisPlateformeFixe: 0.3,
  fraisPaiementPct: 1.5,
  fraisPaiementFixe: 0.25,
  cpa: 10,
};

// Interface pour les paramètres de calcul (sans id)
interface CalculParams {
  prixVente: number;
  coutAchat: number;
  coutExpedition: number;
  fraisPlateformePct: number;
  fraisPlateformeFixe: number;
  fraisPaiementPct: number;
  fraisPaiementFixe: number;
  cpa: number;
}

function calculer({
  prixVente,
  coutAchat,
  coutExpedition,
  fraisPlateformePct,
  fraisPlateformeFixe,
  fraisPaiementPct,
  fraisPaiementFixe,
  cpa,
}: CalculParams) {
  const fraisPlateforme = prixVente * (fraisPlateformePct / 100) + fraisPlateformeFixe;
  const fraisPaiement = prixVente * (fraisPaiementPct / 100) + fraisPaiementFixe;
  const coutRevientTotal = coutAchat + coutExpedition + fraisPlateforme + fraisPaiement + cpa;
  const margeNette = prixVente - coutRevientTotal;
  const margeNettePct = prixVente > 0 ? (margeNette / prixVente) * 100 : 0;
  
  const coutRevientSansCpa = coutAchat + coutExpedition + fraisPlateforme + fraisPaiement;
  const roasCible = prixVente - coutRevientSansCpa > 0 ? prixVente / (prixVente - coutRevientSansCpa) : 0;
  
  return { coutRevientTotal, margeNette, margeNettePct, roasCible };
}

export default function ProfitCalculator() {
  // Utilisation d'un ID unique par produit pour une meilleure gestion React
  const [products, setProducts] = useState([{ ...defaultInputs, id: Date.now() }]);
  const [selected, setSelected] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const { name, value } = e.target;
    // Validation simple pour éviter les erreurs NaN
    setProducts((prev) => prev.map((p, i) => i === idx ? { ...p, [name]: value === "" ? 0 : parseFloat(value) } : p));
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, { ...defaultInputs, id: Date.now() }]);
    // Bascule automatique sur le nouveau produit créé
    setSelected(products.length);
  };

  const removeProduct = (e: React.MouseEvent, indexToDelete: number) => {
    e.stopPropagation(); // Empêche le clic de sélectionner l'onglet pendant la suppression
    if (products.length <= 1) return;

    const newProducts = products.filter((_, i) => i !== indexToDelete);
    setProducts(newProducts);
    // Ajustement de la sélection si nécessaire
    if (selected >= indexToDelete && selected > 0) {
        setSelected(selected - 1);
    }
  };

  const currentProduct = products[selected];
  
  // Extraire seulement les propriétés nécessaires pour calculer
  const calculParams: CalculParams = {
    prixVente: currentProduct.prixVente,
    coutAchat: currentProduct.coutAchat,
    coutExpedition: currentProduct.coutExpedition,
    fraisPlateformePct: currentProduct.fraisPlateformePct,
    fraisPlateformeFixe: currentProduct.fraisPlateformeFixe,
    fraisPaiementPct: currentProduct.fraisPaiementPct,
    fraisPaiementFixe: currentProduct.fraisPaiementFixe,
    cpa: currentProduct.cpa,
  };
  
  const outputs = calculer(calculParams);

  // Données Graphique
  const chartData = {
    labels: Array.from({ length: 21 }, (_, i) => (30 + i * 2)),
    datasets: [
      {
        label: "Marge nette (€)",
        data: Array.from({ length: 21 }, (_, i) => {
          const prixVente = 30 + i * 2;
          const o = calculer({ ...calculParams, prixVente });
          return o.margeNette;
        }),
        borderColor: "#2563eb",
        backgroundColor: "#60a5fa33",
        tension: 0.3,
      },
      {
        label: "ROAS cible",
        data: Array.from({ length: 21 }, (_, i) => {
          const prixVente = 30 + i * 2;
          const o = calculer({ ...calculParams, prixVente });
          return o.roasCible;
        }),
        borderColor: "#16a34a",
        backgroundColor: "#bbf7d033",
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true, mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Marge (€)' } },
      y1: { 
        beginAtZero: true, 
        position: 'right' as const, 
        title: { display: true, text: 'ROAS' }, 
        grid: { drawOnChartArea: false } 
      },
    },
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    setExportStatus('loading');
    // Simulation UX d'un chargement
    setTimeout(() => {
        alert(`Fonction d'export ${type.toUpperCase()} prête (simulation).`);
        setExportStatus('idle');
    }, 800);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-8 lg:p-10 rounded-2xl shadow-lg border border-blue-100 transition-all">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          Calculateur de rentabilité
          <button 
            onClick={addProduct} 
            className="ml-4 rounded bg-blue-600 text-white px-3 py-1 text-xs font-semibold hover:bg-blue-700 transition shadow active:scale-95"
          >
            + Ajouter un produit
          </button>
        </h2>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <button 
            onClick={() => handleExport('pdf')} 
            disabled={exportStatus === 'loading'}
            className="rounded bg-white border border-blue-600 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exportStatus === 'loading' ? '...' : 'Export PDF'}
          </button>
          <button 
            onClick={() => handleExport('excel')} 
            disabled={exportStatus === 'loading'}
            className="rounded bg-white border border-blue-600 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
             {exportStatus === 'loading' ? '...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((p, i) => (
          <div
            key={p.id}
            onClick={() => setSelected(i)}
            className={`
                group relative flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold border cursor-pointer select-none whitespace-nowrap
                ${selected === i 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105' 
                    : 'bg-white text-blue-700 border-blue-200 hover:border-blue-300 hover:bg-blue-50'} 
                transition-all duration-200
            `}
          >
            Produit {i + 1}
            {products.length > 1 && (
                <button
                    onClick={(e) => removeProduct(e, i)}
                    className={`ml-1 rounded-full p-0.5 hover:bg-red-500 hover:text-white transition-colors ${selected === i ? 'text-blue-200' : 'text-blue-400 opacity-0 group-hover:opacity-100'}`}
                    title="Supprimer"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <InputPanel inputs={currentProduct} onInputChange={e => handleInputChange(e, selected)} />
        <ProfitDashboard outputs={outputs} />
      </div>

      <div className="mt-12 flex justify-center">
        <div className="w-full md:w-4/5 lg:w-3/5 bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-2xl p-6 md:p-8 border border-blue-200 shadow-lg">
          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center gap-2">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="inline-block"><path d="M4 17l6-6 4 4 6-6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="1.5" opacity="0.2"/></svg>
            Évolution de la marge & ROAS
          </h3>
          <div className="h-64 md:h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}