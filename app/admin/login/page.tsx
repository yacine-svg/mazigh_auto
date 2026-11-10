import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";
import { ShaderBackground } from "@/app/components/site/ShaderBackground";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="adm">
      <main className="login">
        <aside className="login-side" aria-hidden="true">
          <ShaderBackground preset="login" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-bg/40" />
          <div className="absolute inset-x-10 bottom-10 grid gap-5">
            <p className="eyebrow text-fg-2">Back-office · Showroom Kecherid Auto</p>
            <p className="display text-[clamp(2.6rem,5vw,4.8rem)]">
              Le showroom,
              <br />
              en main<span className="text-brand">.</span>
            </p>
            <p className="max-w-md text-sm text-fg-2">
              Stock, statuts, photos, ventes et marges : tout le parc de Mazigh Auto au même endroit.
            </p>
          </div>
        </aside>

        <section className="grid place-items-center px-5 py-12" aria-labelledby="admin-login-title">
          <div className="grid w-full max-w-sm gap-7">
            <Wordmark href="/" suffix="Back-office" />
            <div>
              <h1 id="admin-login-title" className="display text-4xl">
                Connexion
              </h1>
              <p className="mt-2 text-sm text-fg-3">Accès réservé aux propriétaires de Mazigh Auto.</p>
            </div>

            <LoginForm />

            <div className="flex items-center justify-between gap-4 border-t border-line pt-5 text-sm">
              <Link href="/" className="inline-flex items-center gap-2 text-fg-3 transition-colors hover:text-fg">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour au site
              </Link>
              <span className="inline-flex items-center gap-1.5 text-xs text-fg-3">
                <ShieldCheck className="h-3.5 w-3.5 text-ok" aria-hidden="true" /> Connexion sécurisée
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
