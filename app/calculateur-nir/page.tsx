import SecurityNumberCalculator from '../(components)/calculator/Calculator_nir';

export const metadata = {
  title: 'Calculateur NIR — ProfitEngine',
  description: 'Validez et calculez la clé de contrôle de votre numéro de sécurité sociale (NIR)',
};

export default function CalculateurNIRPage() {
  return (
    <main>
      <SecurityNumberCalculator />
    </main>
  );
}
