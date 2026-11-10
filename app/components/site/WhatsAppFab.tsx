import { MessageCircle } from "lucide-react";
import { buildGenericWhatsAppUrl } from "@/lib/config";

/** Floating WhatsApp shortcut on phones, where the header button is hidden. */
export function WhatsAppFab() {
  return (
    <a
      href={buildGenericWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Contacter Mazigh Auto sur WhatsApp"
      className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-[#04210f] shadow-[0_12px_30px_-8px_rgba(37,211,102,0.6)] transition-transform hover:scale-105 sm:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
