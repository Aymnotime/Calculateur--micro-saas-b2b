
import Hero from "./(components)/home/Hero";
import FeatureSection from "./(components)/home/FeatureSection";
import SocialProof from "./(components)/home/SocialProof";
import BlogPreview from "./(components)/home/BlogPreview";
import ProfitCalculator from "./(components)/calculator/ProfitCalculator";
import ContactForm from "./(components)/shared/ContactForm";

export const metadata = {
  title: 'Accueil — ProfitEngine',
};

export default function HomePage() {
  return (
    <main>
      <div className="w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300 py-4 text-center mb-4 shadow">
        <span className="text-white text-lg font-semibold tracking-wide">
          Maîtrisez vos marges dès aujourd’hui !
        </span>
      </div>
      <Hero />
      <section id="tool" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfitCalculator />
          <div className="mt-16 max-w-2xl mx-auto">
          </div>
        </div>
      </section>
    </main>
  );
}
