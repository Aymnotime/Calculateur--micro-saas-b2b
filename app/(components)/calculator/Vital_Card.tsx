"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Déclaration pour jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// CONSTANTES PROFESSIONNELLES
const TARIFS = {
  // Tarifs conventionnels secteur 1 (2024)
  GENERALISTE: 26.50, // Nouveau tarif 2024 (augmentation progressive)
  SPECIALISTE: 31.50,
  DENTISTE: 28.00,
  GYNECOLOGUE: 31.50,
  
  // Taux de remboursement par spécialité
  TAUX: {
    GENERALISTE: 0.70, // 70%
    SPECIALISTE: 0.70, // 70%
    DENTISTE: 0.70, // 70%
    GYNECOLOGUE: 0.70, // 70%
    HOSPITALISATION: 0.80, // 80%
  },
  
  // Participation forfaitaire (varie selon le type de soin)
  PARTICIPATION: {
    CONSULTATION: 1.00,
    ACTE_TECHNIQUE: 0.50,
    PHARMACIE: 0.50,
  },
  
  // Franchises médicales (annuelles)
  FRANCHISE: {
    MEDICAMENT: 0.50,
    ACTE_PARAMEDICAL: 0.50,
    TRANSPORT: 2.00,
  }
};

// Types de soins disponibles
const TYPES_SOINS = [
  { id: 'generaliste', label: 'Médecin généraliste', base: TARIFS.GENERALISTE, taux: TARIFS.TAUX.GENERALISTE, secteur2Multiplier: 1.3 },
  { id: 'specialiste', label: 'Spécialiste secteur 1', base: TARIFS.SPECIALISTE, taux: TARIFS.TAUX.SPECIALISTE, secteur2Multiplier: 1.5 },
  { id: 'dentiste', label: 'Dentiste', base: TARIFS.DENTISTE, taux: TARIFS.TAUX.DENTISTE, secteur2Multiplier: 1.4 },
  { id: 'gynecologue', label: 'Gynécologue', base: TARIFS.GYNECOLOGUE, taux: TARIFS.TAUX.GYNECOLOGUE, secteur2Multiplier: 1.6 },
  { id: 'medicament', label: 'Médicament', base: 0, taux: 0.65, secteur2Multiplier: 1 }, // Médicament 65%
  { id: 'hospitalisation', label: 'Hospitalisation', base: 0, taux: TARIFS.TAUX.HOSPITALISATION, secteur2Multiplier: 1.2 },
];

// Options mutuelles avec description réelle
const MUTUELLES = [
  { value: '0', label: 'Aucune mutuelle', description: 'Pas de complémentaire santé' },
  { value: '100', label: 'Mutuelle 100%', description: 'Rembourse le ticket modérateur (30%)' },
  { value: '125', label: 'Mutuelle 125%', description: 'Ticket modérateur + 25% dépassement' },
  { value: '150', label: 'Mutuelle 150%', description: 'Ticket modérateur + 50% dépassement' },
  { value: '200', label: 'Mutuelle 200%', description: 'Ticket modérateur + 100% dépassement' },
  { value: '300', label: 'Mutuelle 300%', description: 'Ticket modérateur + 200% dépassement (haut de gamme)' },
  { value: '400', label: 'Mutuelle 400%', description: 'Remboursement intégral + forfait confort' },
];

// Interfaces TypeScript
interface TypeSoin {
  id: string;
  label: string;
  base: number;
  taux: number;
  secteur2Multiplier: number;
}

interface Mutuelle {
  value: string;
  label: string;
  description: string;
}

interface SimulationDetails {
  participationForfaitaire: boolean;
  franchiseMedicale: boolean;
  exonerations: boolean;
}

interface Simulation {
  id: number;
  nom: string;
  typeSoin: string;
  secteur: string;
  montant: number;
  mutuelle: string;
  hasCMU: boolean;
  hasACS: boolean;
  details: SimulationDetails;
}

interface CalculResults {
  baseSecu: number;
  depassement: number;
  remboursementSecu: number;
  remboursementMutuelle: number;
  ticketModerateur: number;
  resteCharge: number;
  tauxRemboursementTotal: number;
  tauxRemboursementSecu: number;
  participationForfaitaire: number;
  franchiseMedicale: number;
  exoneration: boolean;
}

type ColorType = 'green' | 'blue' | 'red' | 'amber' | 'gray';

// Simulation par défaut
const defaultSimulation: Simulation = {
  id: Date.now(),
  nom: 'Consultation type',
  typeSoin: 'generaliste',
  secteur: '1',
  montant: TARIFS.GENERALISTE,
  mutuelle: '150',
  hasCMU: false,
  hasACS: false,
  details: {
    participationForfaitaire: true,
    franchiseMedicale: true,
    exonerations: false,
  }
};

// Composant Input avec validation
interface InputFieldProps {
  label: string;
  icon: string;
  type?: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  error?: string | null;
  disabled?: boolean;
  unit?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  icon, 
  type = "number", 
  value, 
  onChange, 
  placeholder, 
  step = "0.01", 
  min = "0",
  error = null,
  disabled = false,
  unit = "€"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFocus = () => {
    if (inputRef.current && type === "number") {
      inputRef.current.select();
    }
  };
  
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
        <i className={`fas fa-${icon} mr-2 text-green-600`}></i>
        {label}
        {unit && <span className="ml-1 text-gray-500 text-xs">({unit})</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          step={step}
          min={min}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border rounded-xl 
            focus:ring-2 focus:ring-green-500 focus:border-green-500 
            transition-all duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            placeholder-gray-400
          `}
        />
        {type === "number" && unit && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
            {unit}
          </span>
        )}
        {error && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <i className="fas fa-exclamation-circle text-red-500" title={error}></i>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

// Composant Radio avec style pro
interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, options, value, onChange, disabled = false }) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      {label}
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((option) => (
        <div key={option.value} className="relative">
          <input
            type="radio"
            id={`${label}-${option.value}`}
            name={label}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            disabled={disabled}
            className="absolute opacity-0"
          />
          <label
            htmlFor={`${label}-${option.value}`}
            className={`
              block w-full p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
              ${value === option.value 
                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                ${value === option.value ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
              >
                {value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                )}
              </div>
            </div>
          </label>
        </div>
      ))}
    </div>
  </div>
);

// Composant Select amélioré
interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label: string;
  icon: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, icon, value, onChange, options, disabled = false }) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
      <i className={`fas fa-${icon} mr-2 text-green-600`}></i>
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="
          w-full px-4 py-3 border border-gray-300 rounded-xl 
          bg-white cursor-pointer appearance-none
          focus:ring-2 focus:ring-green-500 focus:border-green-500
          transition-all duration-200
          disabled:bg-gray-100 disabled:cursor-not-allowed
        "
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <i className="fas fa-chevron-down text-gray-400"></i>
      </div>
    </div>
    {MUTUELLES.find(m => m.value === value)?.description && (
      <p className="mt-2 text-xs text-gray-500">
        {MUTUELLES.find(m => m.value === value)?.description}
      </p>
    )}
  </div>
);

// Composant Checkbox
interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange, description }) => (
  <div className="mb-4">
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`
          w-5 h-5 border-2 rounded flex items-center justify-center transition-colors
          ${checked ? 'border-green-500 bg-green-500' : 'border-gray-300'}
        `}>
          {checked && <i className="fas fa-check text-white text-xs"></i>}
        </div>
      </div>
      <div className="ml-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </label>
  </div>
);

// Composant Résultat
interface ResultCardProps {
  title: string;
  amount: number | string;
  color?: ColorType;
  icon: string;
  subtext?: string;
  trend?: number | null;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, amount, color = "green", icon, subtext, trend = null }) => {
  const colors: Record<ColorType, string> = {
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    red: "border-red-200 bg-red-50",
    amber: "border-amber-200 bg-amber-50",
    gray: "border-gray-200 bg-gray-50",
  };
  
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600 flex items-center mb-1">
            <i className={`fas fa-${icon} mr-2`}></i>
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {typeof amount === 'number' ? amount.toFixed(2) : amount} €
          </div>
          {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
};

// COMPOSANT PRINCIPAL
export default function VitaleCalculatorPro() {
  const [simulations, setSimulations] = useState<Simulation[]>([defaultSimulation]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [chartData, setChartData] = useState<any>(null);
  const [montantError, setMontantError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const currentSim = simulations[selectedIndex];
  const selectedSoin = TYPES_SOINS.find(t => t.id === currentSim.typeSoin);

  // CALCUL PROFESSIONNEL
  const calculerRemboursement = (sim: Simulation): CalculResults | null => {
    try {
      const montant = typeof sim.montant === 'string' ? parseFloat(sim.montant) : sim.montant || 0;
      const secteur = sim.secteur;
      const tauxMutuelle = parseInt(sim.mutuelle) || 0;
      const soin = TYPES_SOINS.find(t => t.id === sim.typeSoin) || TYPES_SOINS[0];
      
      // VALIDATION DU MONTANT
      if (montant < 0 || montant > 10000) {
        return null;
      }
      
      // 1. BASE DE REMBOURSEMENT SÉCU
      let baseSecu = soin.base;
      
      if (secteur === "2" && soin.base > 0) {
        // Pour secteur 2 avec honoraires libres
        // On considère que le médecin peut facturer plus que la base
        // Mais la Sécu ne rembourse que sur la base conventionnelle
        baseSecu = soin.base; // La Sécu rembourse toujours sur la base
      }
      
      // 2. DÉPASSEMENT D'HONORAIRES
      const depassement = Math.max(0, montant - baseSecu);
      
      // 3. REMBOURSEMENT SÉCU (70% de la base)
      let remboursementSecu = baseSecu * soin.taux;
      
      // 4. PARTICIPATION FORFAITAIRE (si applicable)
      if (sim.details.participationForfaitaire && !sim.hasCMU && !sim.hasACS) {
        remboursementSecu = Math.max(0, remboursementSecu - TARIFS.PARTICIPATION.CONSULTATION);
      }
      
      // 5. TICKET MODÉRATEUR (part non remboursée par la Sécu)
      const ticketModerateur = baseSecu * (1 - soin.taux);
      
      // 6. REMBOURSEMENT MUTUELLE
      let remboursementMutuelle = 0;
      if (tauxMutuelle > 0) {
        const tauxMutuelleDecimal = tauxMutuelle / 100;
        
        // La mutuelle rembourse d'abord le ticket modérateur
        const remboursementTicket = ticketModerateur * Math.min(1, tauxMutuelleDecimal);
        
        // Ensuite le dépassement pour la partie > 100%
        let remboursementDepassement = 0;
        if (tauxMutuelleDecimal > 1 && depassement > 0) {
          const tauxDepassement = tauxMutuelleDecimal - 1;
          remboursementDepassement = depassement * tauxDepassement;
        }
        
        remboursementMutuelle = remboursementTicket + remboursementDepassement;
      }
      
      // 7. RESTE À CHARGE
      let resteCharge = depassement + ticketModerateur - remboursementMutuelle;
      
      // 8. APPLIQUER LES EXONÉRATIONS (CMU/ACS)
      if (sim.hasCMU) {
        resteCharge = 0;
        remboursementMutuelle = 0; // La CMU remplace la mutuelle
      } else if (sim.hasACS) {
        // L'ACS offre une protection complémentaire
        resteCharge = Math.max(0, resteCharge * 0.5); // Réduction de 50% environ
      }
      
      // 9. APPLIQUER LES FRANCHISES MÉDICALES
      if (sim.details.franchiseMedicale && !sim.hasCMU && !sim.hasACS) {
        // Ajouter les franchises selon le type de soin
        let franchise = 0;
        if (sim.typeSoin === 'medicament') {
          franchise = TARIFS.FRANCHISE.MEDICAMENT;
        }
        // Note: les franchises s'appliquent jusqu'à 50€/an maximum
        resteCharge += franchise;
      }
      
      // Assurer que les valeurs sont positives
      remboursementSecu = Math.max(0, remboursementSecu);
      remboursementMutuelle = Math.max(0, remboursementMutuelle);
      resteCharge = Math.max(0, resteCharge);
      
      // Calculer les pourcentages
      const tauxRemboursementTotal = montant > 0 
        ? ((remboursementSecu + remboursementMutuelle) / montant) * 100 
        : 0;
      
      const tauxRemboursementSecu = montant > 0 
        ? (remboursementSecu / montant) * 100 
        : 0;
      
      return {
        baseSecu,
        depassement,
        remboursementSecu,
        remboursementMutuelle,
        ticketModerateur,
        resteCharge,
        tauxRemboursementTotal,
        tauxRemboursementSecu,
        participationForfaitaire: sim.details.participationForfaitaire && !sim.hasCMU && !sim.hasACS 
          ? TARIFS.PARTICIPATION.CONSULTATION 
          : 0,
        franchiseMedicale: sim.details.franchiseMedicale && !sim.hasCMU && !sim.hasACS
          ? (sim.typeSoin === 'medicament' ? TARIFS.FRANCHISE.MEDICAMENT : 0)
          : 0,
        exoneration: sim.hasCMU || sim.hasACS,
      };
    } catch (error) {
      console.error("Erreur de calcul:", error);
      return null;
    }
  };

  const results = useMemo(() => calculerRemboursement(currentSim), [
    currentSim.montant,
    currentSim.secteur,
    currentSim.mutuelle,
    currentSim.typeSoin,
    currentSim.hasCMU,
    currentSim.hasACS,
    currentSim.details.participationForfaitaire,
    currentSim.details.franchiseMedicale
  ]);

  // Mise à jour du graphique
  useEffect(() => {
    if (!currentSim || !results) return;
    
    const labels = Array.from({ length: 20 }, (_, i) => 10 + i * 5); // De 10€ à 105€
    const data = labels.map(montant => {
      const sim = { ...currentSim, montant };
      const res = calculerRemboursement(sim);
      return res ? res.resteCharge : 0;
    });
    
    const dataSecu = labels.map(montant => {
      const sim = { ...currentSim, montant };
      const res = calculerRemboursement(sim);
      return res ? res.remboursementSecu : 0;
    });
    
    const dataMutuelle = labels.map(montant => {
      const sim = { ...currentSim, montant };
      const res = calculerRemboursement(sim);
      return res ? res.remboursementMutuelle : 0;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: "Remboursement Sécu",
          data: dataSecu,
          borderColor: "#00A95F",
          backgroundColor: "rgba(0, 169, 95, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: "Remboursement Mutuelle",
          data: dataMutuelle,
          borderColor: "#0053A1",
          backgroundColor: "rgba(0, 83, 161, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: "Reste à charge",
          data: data,
          borderColor: "#DC2626",
          backgroundColor: "rgba(220, 38, 38, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    });
  }, [currentSim, results]);

  // Gestionnaires d'événements
  const handleInputChange = (field: keyof Simulation, value: any) => {
    setSimulations(prev => prev.map((sim, idx) => 
      idx === selectedIndex ? { ...sim, [field]: value } : sim
    ));
  };

  const handleDetailChange = (field: keyof SimulationDetails, value: boolean) => {
    setSimulations(prev => prev.map((sim, idx) => 
      idx === selectedIndex ? { 
        ...sim, 
        details: { ...sim.details, [field]: value }
      } : sim
    ));
  };

  const addSimulation = () => {
    const newSim: Simulation = {
      ...defaultSimulation,
      id: Date.now(),
      nom: `Simulation ${simulations.length + 1}`,
      montant: selectedSoin?.base || TARIFS.GENERALISTE,
    };
    setSimulations([...simulations, newSim]);
    setSelectedIndex(simulations.length);
  };

  const removeSimulation = (index: number) => {
    if (simulations.length <= 1) return;
    
    const newSims = simulations.filter((_, i) => i !== index);
    setSimulations(newSims);
    
    if (selectedIndex >= index && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Export PDF
  const exportToPDF = () => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString('fr-FR');
      
      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(0, 169, 95);
      doc.text('SIMULATION CARTE VITALE', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le ${date}`, 105, 30, { align: 'center' });
      
      // Informations simulation
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Paramètres de simulation:', 20, 45);
      
      const params = [
        ['Type de soin:', TYPES_SOINS.find(t => t.id === currentSim.typeSoin)?.label || ''],
        ['Secteur:', currentSim.secteur === '1' ? 'Secteur 1 (conventionné)' : 'Secteur 2 (honoraires libres)'],
        ['Montant:', `${currentSim.montant} €`],
        ['Mutuelle:', MUTUELLES.find(m => m.value === currentSim.mutuelle)?.label || ''],
        ['CMU:', currentSim.hasCMU ? 'Oui' : 'Non'],
        ['ACS:', currentSim.hasACS ? 'Oui' : 'Non'],
      ];
      
      // Premier tableau
      autoTable(doc, {
        startY: 50,
        head: [['Paramètre', 'Valeur']],
        body: params,
        theme: 'grid',
        headStyles: { fillColor: [0, 169, 95] },
      });
      
      // Récupérer la position Y après le premier tableau
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 70;
      
      // Résultats
      if (results) {
        doc.setFontSize(12);
        doc.text('Résultats du calcul:', 20, finalY + 15);
        
        const resultats = [
          ['Base Sécu:', `${results.baseSecu.toFixed(2)} €`],
          ['Remboursement Sécu:', `${results.remboursementSecu.toFixed(2)} €`],
          ['Remboursement Mutuelle:', `${results.remboursementMutuelle.toFixed(2)} €`],
          ['Ticket modérateur:', `${results.ticketModerateur.toFixed(2)} €`],
          ['Dépassement:', `${results.depassement.toFixed(2)} €`],
          ['Participation forfaitaire:', `${results.participationForfaitaire.toFixed(2)} €`],
          ['Reste à charge:', `${results.resteCharge.toFixed(2)} €`],
        ];
        
        // Deuxième tableau
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Détail', 'Montant']],
          body: resultats,
          theme: 'grid',
          headStyles: { fillColor: [0, 83, 161] },
        });
        
        const finalY2 = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 100;
        
        // Disclaimer
        doc.setFontSize(8);
        doc.setTextColor(100);
        const disclaimer = "Simulation indicative. Les montants réels peuvent varier selon votre situation et votre contrat. Consultez votre caisse d'assurance maladie pour des informations exactes.";
        doc.text(disclaimer, 105, finalY2 + 20, { align: 'center', maxWidth: 170 });
      }
      
      // Sauvegarde
      doc.save(`simulation-carte-vitale-${date.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    setExporting(true);
    
    try {
      if (!results) return;
      
      const csvContent = [
        ['Paramètre', 'Valeur'],
        ['Type de soin', TYPES_SOINS.find(t => t.id === currentSim.typeSoin)?.label],
        ['Secteur', currentSim.secteur === '1' ? 'Secteur 1' : 'Secteur 2'],
        ['Montant', `${currentSim.montant} €`],
        ['Mutuelle', MUTUELLES.find(m => m.value === currentSim.mutuelle)?.label],
        ['', ''],
        ['Résultat', 'Montant'],
        ['Base Sécu', `${results.baseSecu.toFixed(2)} €`],
        ['Remboursement Sécu', `${results.remboursementSecu.toFixed(2)} €`],
        ['Remboursement Mutuelle', `${results.remboursementMutuelle.toFixed(2)} €`],
        ['Ticket modérateur', `${results.ticketModerateur.toFixed(2)} €`],
        ['Dépassement', `${results.depassement.toFixed(2)} €`],
        ['Reste à charge', `${results.resteCharge.toFixed(2)} €`],
        ['Taux remboursement total', `${results.tauxRemboursementTotal.toFixed(1)} %`],
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `simulation-carte-vitale-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur export CSV:", error);
      alert("Erreur lors de l'export CSV");
    } finally {
      setExporting(false);
    }
  };

  // Options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} €`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Montant consultation (€)',
          color: '#6B7280',
          font: { size: 12 }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Montant (€)',
          color: '#6B7280',
          font: { size: 12 }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest' as const
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    }
  };

  // Rendu
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 md:p-8 relative">
            {/* Pictogramme Carte Vitale */}
            <div className="absolute right-6 top-6 hidden md:flex space-x-2">
              <div className="w-5 h-8 bg-white rounded-sm"></div>
              <div className="w-5 h-10 bg-white rounded-sm"></div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Calculateur de Remboursements Médicaux
            </h1>
            <p className="text-emerald-100 text-sm md:text-base">
              Simulation précise de vos remboursements de santé
            </p>
          </div>
          
          {/* Barre d'actions */}
          <div className="bg-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={addSimulation}
                disabled={exporting}
                className="px-4 py-2 bg-white text-green-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i>
                Nouvelle simulation
              </button>
              
              <div className="text-sm text-white">
                {simulations.length} simulation{simulations.length > 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToPDF}
                disabled={exporting || !results}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center"
              >
                {exporting ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-file-pdf mr-2"></i>
                )}
                PDF
              </button>
              
              <button
                onClick={exportToCSV}
                disabled={exporting || !results}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center"
              >
                {exporting ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-file-excel mr-2"></i>
                )}
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex overflow-x-auto mb-6 bg-gray-50 rounded-xl p-1">
          {simulations.map((sim, index) => (
            <div
              key={sim.id}
              className={`
                flex items-center px-4 py-3 mx-1 rounded-lg cursor-pointer transition-all min-w-max
                ${selectedIndex === index 
                  ? 'bg-white text-green-700 shadow border border-green-200' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              onClick={() => setSelectedIndex(index)}
            >
              <i className={`fas fa-${sim.typeSoin === 'medicament' ? 'pills' : 'stethoscope'} mr-2`}></i>
              {sim.nom}
              {simulations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSimulation(index);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Colonne gauche - Formulaire */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <i className="fas fa-sliders-h mr-3 text-green-600"></i>
              Paramètres de simulation
            </h2>
            
            <SelectField
              label="Type de soin"
              icon="stethoscope"
              value={currentSim.typeSoin}
              onChange={(e) => {
                const newType = e.target.value;
                const soin = TYPES_SOINS.find(t => t.id === newType);
                handleInputChange('typeSoin', newType);
                if (soin && soin.base > 0) {
                  handleInputChange('montant', soin.base);
                }
              }}
              options={TYPES_SOINS.map(soin => ({
                value: soin.id,
                label: soin.label,
                description: soin.base > 0 ? `Base: ${soin.base.toFixed(2)}€` : 'Base variable'
              }))}
            />
            
            <RadioGroup
              label="Secteur médical"
              value={currentSim.secteur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('secteur', e.target.value)}
              options={[
                { 
                  value: '1', 
                  label: 'Secteur 1', 
                  description: 'Tarif conventionné. Honoraires fixes.' 
                },
                { 
                  value: '2', 
                  label: 'Secteur 2', 
                  description: 'Honoraires libres. Dépassements possibles.' 
                },
              ]}
            />
            
            <InputField
              label="Montant facturé"
              icon="euro-sign"
              value={currentSim.montant}
              onChange={(e) => handleInputChange('montant', e.target.value)}
              placeholder={`ex: ${selectedSoin?.base || TARIFS.GENERALISTE}`}
              step="0.01"
              min="0"
              error={montantError}
              unit="€"
            />
            
            <SelectField
              label="Complémentaire santé"
              icon="shield-alt"
              value={currentSim.mutuelle}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('mutuelle', e.target.value)}
              options={MUTUELLES}
            />
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <i className="fas fa-user-check mr-2 text-blue-600"></i>
                Situation particulière
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckboxField
                  label="Bénéficiaire CMU-C"
                  checked={currentSim.hasCMU}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleInputChange('hasCMU', e.target.checked);
                    if (e.target.checked) handleInputChange('hasACS', false);
                  }}
                  description="Couverture Maladie Universelle Complémentaire"
                />
                
                <CheckboxField
                  label="Bénéficiaire ACS"
                  checked={currentSim.hasACS}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleInputChange('hasACS', e.target.checked);
                    if (e.target.checked) handleInputChange('hasCMU', false);
                  }}
                  description="Aide au paiement d'une Complémentaire Santé"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <i className="fas fa-cog mr-2 text-gray-600"></i>
                Options de calcul
              </h3>
              
              <CheckboxField
                label="Appliquer la participation forfaitaire"
                checked={currentSim.details.participationForfaitaire}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDetailChange('participationForfaitaire', e.target.checked)}
                description="1€ par consultation (sauf exonération)"
              />
              
              <CheckboxField
                label="Prendre en compte les franchises"
                checked={currentSim.details.franchiseMedicale}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDetailChange('franchiseMedicale', e.target.checked)}
                description="Franchises médicales applicables (0.50€ par boîte)"
              />
            </div>
          </div>
          
          {/* Colonne droite - Résultats */}
          <div className="space-y-8">
            
            {/* Cartes de résultats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="fas fa-chart-pie mr-3 text-blue-600"></i>
                Synthèse du remboursement
              </h2>
              
              {!results ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <i className="fas fa-calculator text-4xl text-green-600 mb-4"></i>
                    <p className="text-gray-600">Configurez les paramètres pour voir les résultats</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <ResultCard
                      title="Remboursement Sécu"
                      amount={results.remboursementSecu}
                      color="green"
                      icon="shield-alt"
                      subtext={`${results.tauxRemboursementSecu.toFixed(1)}% du montant`}
                    />
                    
                    <ResultCard
                      title="Remboursement Mutuelle"
                      amount={results.remboursementMutuelle}
                      color="blue"
                      icon="hand-holding-medical"
                      subtext={`${MUTUELLES.find(m => m.value === currentSim.mutuelle)?.label}`}
                    />
                    
                    <ResultCard
                      title="Ticket modérateur"
                      amount={results.ticketModerateur}
                      color="amber"
                      icon="receipt"
                      subtext="Part non remboursée par la Sécu"
                    />
                    
                    <ResultCard
                      title="Dépassement"
                      amount={results.depassement}
                      color="red"
                      icon="exclamation-triangle"
                      subtext="Honoraires au-delà de la base"
                    />
                  </div>
                  
                  {/* Reste à charge */}
                  <div className={`
                    border-2 rounded-xl p-6 mt-6
                    ${results.resteCharge === 0 
                      ? 'border-green-200 bg-green-50' 
                      : results.resteCharge < 10
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-red-200 bg-red-50'
                    }
                  `}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 flex items-center mb-2">
                          <i className={`fas fa-wallet mr-2 ${results.resteCharge === 0 ? 'text-green-600' : 'text-red-600'}`}></i>
                          RESTE À CHARGE FINAL
                        </div>
                        <div className={`text-3xl font-bold ${results.resteCharge === 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {results.resteCharge.toFixed(2)} €
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          {results.resteCharge === 0 
                            ? "Prise en charge intégrale" 
                            : results.resteCharge < 10
                            ? "Participation modérée"
                            : "Participation significative"
                          }
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {results.tauxRemboursementTotal.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">de remboursement total</div>
                      </div>
                    </div>
                    
                    {/* Détails supplémentaires */}
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500">Base de remboursement</div>
                        <div className="font-medium">{results.baseSecu.toFixed(2)} €</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Participation forfaitaire</div>
                        <div className="font-medium">{results.participationForfaitaire.toFixed(2)} €</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Cartes informatives */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-lightbulb mr-2 text-blue-600"></i>
                Conseils pratiques
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Le tarif conventionné du médecin généraliste est de <strong>26.50€</strong> depuis le 1er novembre 2024</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>La participation forfaitaire de 1€ s'applique à chaque acte (sauf exonération)</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Les médecins secteur 2 peuvent pratiquer des dépassements d'honoraires</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  <span>Consultez votre décompte Ameli pour les montants exacts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Graphique */}
        {chartData && results && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <i className="fas fa-chart-line mr-3 text-purple-600"></i>
                Analyse par montant de consultation
              </h2>
              <div className="text-sm text-gray-500 mt-2 md:mt-0">
                Évolution des remboursements selon le montant facturé
              </div>
            </div>
            
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Montant optimal</div>
                <div className="text-xl font-bold text-green-700">
                  {selectedSoin?.base.toFixed(2) || TARIFS.GENERALISTE.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-500">Base conventionnelle</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Seuil dépassement</div>
                <div className="text-xl font-bold text-amber-700">
                  {((selectedSoin?.base || TARIFS.GENERALISTE) * (selectedSoin?.secteur2Multiplier || 1.5)).toFixed(2)} €
                </div>
                <div className="text-xs text-gray-500">Typique secteur 2</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Remboursement max</div>
                <div className="text-xl font-bold text-blue-700">
                  {results.tauxRemboursementTotal.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Taux avec mutuelle</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer / Disclaimer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-500 mr-3 mt-1"></i>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Informations importantes</h3>
              <p className="text-sm text-gray-600 mb-3">
                Cette simulation est fournie à titre indicatif. Les calculs sont basés sur les tarifs conventionnels 
                en vigueur et les taux de remboursement standards. Les montants réels peuvent varier en fonction de 
                votre situation particulière, de votre contrat de complémentaire santé, des éventuelles franchises 
                annuelles et des spécificités de votre prise en charge.
              </p>
              <p className="text-sm text-gray-600">
                Pour des informations exactes, consultez votre compte Ameli ou contactez votre caisse d'assurance maladie. 
                Les tarifs sont ceux applicables au {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}