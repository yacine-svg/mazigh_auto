import { TradeInFormClient } from "./TradeInFormClient";
import { LineReveal } from "@/app/components/site/Reveal";
import { SHOWROOM_CONFIG } from "@/lib/config";

export const metadata = {
  title: "Vendre ou Échanger ma voiture | MAZIGH AUTO - El Khroub, Constantine",
  description:
    "Faites estimer votre véhicule pour un rachat cash rapide ou un échange chez Mazigh Auto (Showroom Kecherid Auto) à El Khroub, Constantine.",
};

const steps = [
  ["Décrivez", "Marque, modèle, année, kilométrage et état de votre voiture."],
  ["Envoyez", "Le formulaire ouvre WhatsApp avec un message prêt à partir."],
  ["Recevez", "Une offre claire : rachat cash ou échange contre un véhicule du parc."],
] as const;

export default function VendreEchangerPage() {
  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_95%_10%,rgba(227,38,47,0.18),transparent_70%)]" aria-hidden="true" />
      <div className="wrap relative grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow">{SHOWROOM_CONFIG.city} · Rachat & échange</p>
          <LineReveal
            as="h1"
            lines={["Vendez ou", <>échangez<span className="text-brand">.</span></>]}
            className="display mt-5 text-[clamp(2.8rem,8vw,7rem)]"
          />
          <p className="mt-6 max-w-md text-fg-2">
            Remplissez les informations de votre véhicule. L&apos;équipe vous recontacte sur WhatsApp avec une
            estimation claire et une offre concrète.
          </p>

          <ol className="mt-10 divide-y divide-line border-y border-line">
            {steps.map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 py-5">
                <span className="mono text-sm text-brand">0{i + 1}</span>
                <span>
                  <span className="display block text-xl">{title}</span>
                  <span className="mt-1 block text-sm text-fg-3">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <TradeInFormClient />
      </div>
    </section>
  );
}
