import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(227,38,47,0.2),transparent_70%)]" aria-hidden="true" />
      <header className="wrap flex h-20 items-center">
        <Wordmark />
      </header>
      <section className="wrap relative flex flex-1 flex-col justify-center py-16">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="display mt-6 text-[clamp(3rem,11vw,10rem)]">
          Hors <span className="text-brand">route.</span>
        </h1>
        <p className="mt-6 max-w-md text-fg-2">
          Ce véhicule ou cette page n&apos;est plus disponible. Il a peut-être déjà trouvé preneur.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/voitures" className="btn btn-primary btn-lg">
            <ArrowLeft aria-hidden="true" /> Retour au catalogue
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg">
            Accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
