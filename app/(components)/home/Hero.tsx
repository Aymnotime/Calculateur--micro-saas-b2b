import FadeIn from "../animations/FadeIn";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-28 text-center">
        <FadeIn>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
            Arrêtez de deviner. Connaissez votre profit réel.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            L'outil n°1 pour les e-commerçants qui veulent maîtriser leurs marges.
            Utilisable gratuitement, directement sur cette page.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="#tool" className="rounded-md bg-blue-600 text-white px-6 py-3 text-base font-semibold hover:bg-blue-700 transition">
              Essayer l'outil gratuit ↓
            </a>
            <Link href="#features" className="text-gray-700 hover:text-gray-900 font-medium">
              Voir les fonctionnalités
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
