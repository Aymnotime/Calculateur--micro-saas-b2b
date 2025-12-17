"use client";

import React from 'react';
import ResultCard from '../shared/ResultCard';
import AffiliateBox from '../shared/AffiliateBox';

interface CalculatorOutputs {
  coutRevientTotal: number;
  margeNette: number;
  margeNettePct: number;
  roasCible: number;
}

interface Props {
  outputs: CalculatorOutputs;
}

export default function ProfitDashboard({ outputs }: Props) {
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const pct = (n: number) => `${n.toFixed(2)} %`;
  const roas = (n: number) => n > 0 ? `${n.toFixed(2)}x` : '—';

  const colorBySign = (n: number): 'green' | 'red' | undefined => (n > 0 ? 'green' : n < 0 ? 'red' : undefined);

  return (
    <section className="md:sticky md:top-8 space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <ResultCard
          titre="Marge Nette (€)"
          valeur={euro.format(outputs.margeNette)}
          couleur={colorBySign(outputs.margeNette)}
          description="Recette après déduction de tous les coûts (achat, expédition, frais, paiement et CPA)."
        />
        <ResultCard
          titre="Marge Nette (%)"
          valeur={pct(outputs.margeNettePct)}
          couleur={colorBySign(outputs.margeNettePct)}
          description="Pourcentage de marge nette par rapport au prix de vente."
        />
        <ResultCard
          titre="ROAS Cible (Break-even)"
          valeur={roas(outputs.roasCible)}
          description="Le ROAS minimum que vos publicités doivent atteindre pour être rentables."
        />
        <ResultCard
          titre="Coût de Revient Total (€)"
          valeur={euro.format(outputs.coutRevientTotal)}
          description="Somme de tous les coûts liés à la vente d'une unité."
        />
      </div>

      {/* Section AffiliateBox retirée */}
    </section>
  );
}
