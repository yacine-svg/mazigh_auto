import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Wordmark } from "@/app/components/Wordmark";
import { signOutAction } from "../auth-actions";

export default function AdminAccessDeniedPage() {
  return (
    <div className="adm grid min-h-screen place-items-center px-5">
      <section className="panel grid w-full max-w-md gap-5 p-7" aria-labelledby="admin-denied-title">
        <Wordmark href="/" suffix="Back-office" />
        <span className="grid h-12 w-12 place-items-center rounded-full bg-bad-soft text-bad">
          <ShieldX className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Accès refusé</p>
          <h1 id="admin-denied-title" className="display mt-3 text-3xl">
            Compte non autorisé
          </h1>
          <p className="mt-2 text-sm text-fg-3">
            Ce compte est connecté, mais ne figure pas parmi les propriétaires autorisés du showroom.
          </p>
        </div>
        <form action={signOutAction}>
          <button className="btn btn-primary btn-lg w-full" type="submit">
            Se déconnecter
          </button>
        </form>
        <Link href="/" className="text-center text-sm text-fg-3 hover:text-fg">
          Retour au site
        </Link>
      </section>
    </div>
  );
}
