import { CarFront, CircleAlert, MessageCircle } from "lucide-react";
import { buildGenericWhatsAppUrl } from "@/lib/config";

type VehicleAvailabilityStateProps = {
  status: "empty" | "error";
};

export function VehicleAvailabilityState({ status }: VehicleAvailabilityStateProps) {
  const isEmpty = status === "empty";
  const Icon = isEmpty ? CarFront : CircleAlert;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-line bg-surface px-6 py-14 text-center sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(227,38,47,0.12),transparent_70%)]" aria-hidden="true" />
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full border border-line-2 text-fg-3">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="display relative mt-6 text-2xl">
        {isEmpty ? "Nouveaux arrivages bientôt" : "Catalogue momentanément indisponible"}
      </p>
      <p className="relative mx-auto mt-3 max-w-md text-sm text-fg-3">
        {isEmpty
          ? "Aucune voiture n'est affichée pour le moment. Écrivez-nous sur WhatsApp pour connaître le stock du jour."
          : "Impossible de charger les véhicules pour le moment. Veuillez réessayer plus tard."}
      </p>
      {isEmpty && (
        <a
          href={buildGenericWhatsAppUrl()}
          target="_blank"
          rel="noreferrer"
          className="btn btn-wa relative mt-7"
        >
          <MessageCircle aria-hidden="true" />
          WhatsApp
        </a>
      )}
    </div>
  );
}
