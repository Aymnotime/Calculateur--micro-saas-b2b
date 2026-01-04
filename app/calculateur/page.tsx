import VitaleCalculator from '../(components)/calculator/Vital_Card';

export const metadata = {
  title: 'Calculateur Vitale — ProfitEngine',
  description: 'Simulateur de remboursement Sécurité Sociale et mutuelle pour vos consultations médicales',
};

export default function CalculateurPage() {
  return (
    <main>
      <VitaleCalculator />
    </main>
  );
}
