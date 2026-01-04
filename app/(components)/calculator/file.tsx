"use client";

// CalculatorCard.jsx
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TARIF_CONVENTIONNE = 25.00;
const TAUX_SECU = 0.70;
const PARTICIPATION_FORFAITAIRE = 1.00;

// Configuration du design
const styles = {
  container: "min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 md:p-8",
  card: "max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100",
  header: "bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 md:p-8 relative",
  title: "text-2xl md:text-3xl font-bold tracking-tight",
  subtitle: "text-green-100 mt-1 text-sm",
  pictogram: "absolute right-6 top-6 flex space-x-2",
  person: "bg-white rounded-sm",
  
  tabs: "flex border-b border-gray-200 bg-gray-50 px-4",
  tab: "px-4 py-3 text-sm font-medium cursor-pointer transition-all relative",
  activeTab: "border-b-2 border-green-600 text-green-700 bg-white",
  tabRemove: "ml-2 text-gray-400 hover:text-red-500",
  
  grid: "grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-8",
  
  inputGroup: "mb-6",
  label: "block text-sm font-semibold text-gray-700 mb-2 flex items-center",
  icon: "mr-2 text-green-600",
  input: "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition",
  inputWithIcon: "relative",
  euroIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold",
  
  radioGroup: "flex space-x-4 mt-2",
  radioOption: "flex-1",
  radioInput: "hidden",
  radioLabel: "block w-full px-4 py-3 text-center border-2 border-gray-300 rounded-xl cursor-pointer transition",
  radioActive: "border-green-500 bg-green-50 text-green-700",
  
  infoText: "text-xs text-gray-500 mt-2 flex items-center",
  
  buttonContainer: "flex justify-center mt-8",
  calculateButton: "px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center",
  
  resultsContainer: "mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white",
  resultRow: "flex justify-between items-center py-3 border-b border-gray-700 last:border-b-0",
  resultLabel: "flex items-center",
  resultValue: "text-lg font-bold",
  restCharge: "text-2xl font-bold mt-4 pt-4 border-t border-gray-700",
  restChargeZero: "text-emerald-400",
  restChargePositive: "text-amber-400",
  
  chartContainer: "mt-10 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200",
  chartTitle: "text-xl font-bold text-gray-800 mb-4 text-center",
  
  disclaimer: "text-xs text-gray-500 text-center p-4 border-t border-gray-200",
  
  exportButtons: "flex justify-end space-x-3 p-4",
  exportButton: "px-4 py-2 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition flex items-center",
};

// Composant Input avec icon
const InputWithIcon = ({ label, icon, type = "number", value, onChange, placeholder, step = "0.01", min = "0" }) => (
  <div className={styles.inputGroup}>
    <label className={styles.label}>
      <i className={`${icon} ${styles.icon}`}></i>
      {label}
    </label>
    <div className={styles.inputWithIcon}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        className={styles.input}
      />
      {type === "number" && <span className={styles.euroIcon}>€</span>}
    </div>
  </div>
);

// Composant Radio Option
const RadioOption = ({ id, name, value, checked, label, onChange }) => (
  <div className={styles.radioOption}>
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className={styles.radioInput}
    />
    <label 
      htmlFor={id} 
      className={`${styles.radioLabel} ${checked ? styles.radioActive : ''}`}
    >
      {label}
    </label>
  </div>
);

// Composant Résultat
const ResultRow = ({ label, value, icon = "check" }) => (
  <div className={styles.resultRow}>
    <span className={styles.resultLabel}>
      <i className={`fas fa-${icon} mr-2 text-green-400`}></i>
      {label}
    </span>
    <span className={styles.resultValue}>{value} €</span>
  </div>
);

// Données initiales
const defaultSimulation = {
  id: Date.now(),
  montant: 50,
  secteur: "1",
  mutuelle: "150",
  nom: "Consultation standard"
};

export default function VitaleCalculator() {
  const [simulations, setSimulations] = useState([defaultSimulation]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [chartData, setChartData] = useState(null);

  const currentSim = simulations[selectedIndex];

  // Fonction de calcul
  const calculerRemboursement = (sim) => {
    const montant = parseFloat(sim.montant) || 0;
    const secteur = sim.secteur;
    const tauxMutuelle = parseInt(sim.mutuelle) || 0;

    let baseRemboursement, depassement, ticketModerateur;
    
    if (secteur === "1") {
      baseRemboursement = TARIF_CONVENTIONNE;
      depassement = Math.max(0, montant - TARIF_CONVENTIONNE);
      ticketModerateur = baseRemboursement * (1 - TAUX_SECU);
    } else {
      baseRemboursement = montant;
      depassement = 0;
      ticketModerateur = montant * (1 - TAUX_SECU);
    }

    // Remboursement Sécu
    let remboursementSecu = baseRemboursement * TAUX_SECU;
    remboursementSecu = Math.max(0, remboursementSecu - PARTICIPATION_FORFAITAIRE);

    // Remboursement mutuelle
    let remboursementMutuelle = 0;
    if (tauxMutuelle > 0) {
      const tauxMutuelleDecimal = tauxMutuelle / 100;
      remboursementMutuelle = ticketModerateur * tauxMutuelleDecimal;
      
      if (tauxMutuelle > 100 && depassement > 0) {
        const tauxSupplement = (tauxMutuelle - 100) / 100;
        const remboursementDepassement = depassement * tauxSupplement;
        remboursementMutuelle += remboursementDepassement;
      }
    }

    const resteCharge = Math.max(0, depassement + ticketModerateur - remboursementMutuelle);

    return {
      remboursementSecu,
      remboursementMutuelle,
      resteCharge,
      ticketModerateur,
      depassement,
      baseRemboursement
    };
  };

  const results = calculerRemboursement(currentSim);

  // Mise à jour du graphique
  useEffect(() => {
    const labels = Array.from({ length: 15 }, (_, i) => 30 + i * 5);
    const dataSecu = labels.map(montant => {
      const sim = { ...currentSim, montant };
      return calculerRemboursement(sim).remboursementSecu;
    });
    const dataMutuelle = labels.map(montant => {
      const sim = { ...currentSim, montant };
      return calculerRemboursement(sim).remboursementMutuelle;
    });
    const dataReste = labels.map(montant => {
      const sim = { ...currentSim, montant };
      return calculerRemboursement(sim).resteCharge;
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
        },
        {
          label: "Remboursement Mutuelle",
          data: dataMutuelle,
          borderColor: "#0053A1",
          backgroundColor: "rgba(0, 83, 161, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Reste à charge",
          data: dataReste,
          borderColor: "#FF6B6B",
          backgroundColor: "rgba(255, 107, 107, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }, [currentSim]);

  // Gestionnaires d'événements
  const handleInputChange = (field, value) => {
    setSimulations(prev => prev.map((sim, idx) => 
      idx === selectedIndex ? { ...sim, [field]: value } : sim
    ));
  };

  const addSimulation = () => {
    const newSim = {
      ...defaultSimulation,
      id: Date.now(),
      nom: `Simulation ${simulations.length + 1}`
    };
    setSimulations([...simulations, newSim]);
    setSelectedIndex(simulations.length);
  };

  const removeSimulation = (index) => {
    if (simulations.length <= 1) return;
    
    const newSims = simulations.filter((_, i) => i !== index);
    setSimulations(newSims);
    
    if (selectedIndex >= index && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const exportToPDF = () => {
    alert("Export PDF en cours de développement...");
    // Implémentation réelle avec jsPDF ou autre bibliothèque
  };

  const exportToExcel = () => {
    alert("Export Excel en cours de développement...");
    // Implémentation réelle avec xlsx ou autre bibliothèque
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)} €`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Montant consultation (€)'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Montant (€)'
        }
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* En-tête avec design Carte Vitale */}
        <div className={styles.header}>
          <div className={styles.pictogram}>
            <div className={styles.person} style={{ width: '14px', height: '20px' }}></div>
            <div className={styles.person} style={{ width: '14px', height: '25px' }}></div>
          </div>
          <h1 className={styles.title}>CALCULATEUR VITALE PRO</h1>
          <p className={styles.subtitle}>Simulation de remboursement Sécurité Sociale</p>
        </div>

        {/* Boutons d'export */}
        <div className={styles.exportButtons}>
          <button onClick={addSimulation} className={styles.exportButton}>
            <i className="fas fa-plus mr-2"></i>
            Nouvelle simulation
          </button>
          <button onClick={exportToPDF} className={styles.exportButton}>
            <i className="fas fa-file-pdf mr-2"></i>
            PDF
          </button>
          <button onClick={exportToExcel} className={styles.exportButton}>
            <i className="fas fa-file-excel mr-2"></i>
            Excel
          </button>
        </div>

        {/* Onglets de simulation */}
        <div className={styles.tabs}>
          {simulations.map((sim, index) => (
            <div
              key={sim.id}
              className={`${styles.tab} ${selectedIndex === index ? styles.activeTab : ''}`}
              onClick={() => setSelectedIndex(index)}
            >
              {sim.nom}
              {simulations.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSimulation(index);
                  }}
                  className={styles.tabRemove}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Grille principale */}
        <div className={styles.grid}>
          {/* Colonne gauche : Formulaire */}
          <div>
            <InputWithIcon
              label="Montant de la consultation"
              icon="fas fa-euro-sign"
              value={currentSim.montant}
              onChange={(e) => handleInputChange('montant', e.target.value)}
              placeholder="ex: 50"
            />

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <i className={`fas fa-stethoscope ${styles.icon}`}></i>
                Secteur médical
              </label>
              <div className={styles.radioGroup}>
                <RadioOption
                  id="secteur1"
                  name="secteur"
                  value="1"
                  checked={currentSim.secteur === "1"}
                  onChange={(e) => handleInputChange('secteur', e.target.value)}
                  label="Secteur 1 (25€)"
                />
                <RadioOption
                  id="secteur2"
                  name="secteur"
                  value="2"
                  checked={currentSim.secteur === "2"}
                  onChange={(e) => handleInputChange('secteur', e.target.value)}
                  label="Secteur 2"
                />
              </div>
              <p className={styles.infoText}>
                <i className="fas fa-info-circle mr-1"></i>
                Secteur 1 : tarif conventionné à 25€
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <i className={`fas fa-shield-alt ${styles.icon}`}></i>
                Votre mutuelle
              </label>
              <select
                value={currentSim.mutuelle}
                onChange={(e) => handleInputChange('mutuelle', e.target.value)}
                className={styles.input}
              >
                <option value="0">Aucune mutuelle</option>
                <option value="100">Mutuelle 100% (rembourse ticket modérateur)</option>
                <option value="150">Mutuelle 150% (rembourse + dépassement partiel)</option>
                <option value="200">Mutuelle 200% (rembourse + dépassement)</option>
                <option value="300">Mutuelle 300% (très bonne mutuelle)</option>
              </select>
            </div>

            <div className={styles.buttonContainer}>
              <button className={styles.calculateButton}>
                <i className="fas fa-calculator mr-2"></i>
                CALCULER AUTOMATIQUEMENT
              </button>
            </div>
          </div>

          {/* Colonne droite : Résultats */}
          <div>
            <div className={styles.resultsContainer}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <i className="fas fa-file-invoice-dollar mr-2"></i>
                DÉTAIL DU REMBOURSEMENT
              </h3>
              
              <ResultRow
                label="Base de remboursement"
                value={results.baseRemboursement.toFixed(2)}
                icon="calculator"
              />
              
              {results.depassement > 0 && (
                <ResultRow
                  label="Dépassement d'honoraires"
                  value={results.depassement.toFixed(2)}
                  icon="exclamation-triangle"
                />
              )}
              
              <ResultRow
                label="Remboursement Sécu"
                value={results.remboursementSecu.toFixed(2)}
                icon="shield-alt"
              />
              
              <ResultRow
                label="Remboursement mutuelle"
                value={results.remboursementMutuelle.toFixed(2)}
                icon="hand-holding-medical"
              />
              
              <div className={`${styles.restCharge} ${
                results.resteCharge === 0 ? styles.restChargeZero : styles.restChargePositive
              }`}>
                <div className="flex justify-between items-center">
                  <span>
                    <i className="fas fa-wallet mr-2"></i>
                    RESTE À CHARGE FINAL
                  </span>
                  <span>{results.resteCharge.toFixed(2)} €</span>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {results.resteCharge === 0 
                    ? "✓ Intégralement remboursé" 
                    : "⚠️ Participation financière restante"}
                </div>
              </div>
            </div>

            {/* Statistiques supplémentaires */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="text-sm text-blue-600">Ticket modérateur</div>
                <div className="text-xl font-bold text-blue-800">
                  {results.ticketModerateur.toFixed(2)} €
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="text-sm text-green-600">Taux de remboursement</div>
                <div className="text-xl font-bold text-green-800">
                  {currentSim.montant > 0 
                    ? (((results.remboursementSecu + results.remboursementMutuelle) / currentSim.montant) * 100).toFixed(1) 
                    : "0"}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique */}
        {chartData && (
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <i className="fas fa-chart-line mr-2"></i>
              ÉVOLUTION DES REMBOURSEMENTS PAR MONTANT
            </h3>
            <div style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <p>
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Simulation indicative - Les montants réels peuvent varier selon votre situation, 
            votre contrat d'assurance et les spécificités de votre prise en charge.
            Données basées sur les tarifs conventionnels en vigueur.
          </p>
        </div>
      </div>
    </div>
  );
}