import type { ReactNode } from "react";
import { SmoothScroll } from "@/app/components/site/SmoothScroll";
import { SiteHeader } from "@/app/components/site/SiteHeader";
import { SiteFooter } from "@/app/components/site/SiteFooter";
import { WhatsAppFab } from "@/app/components/site/WhatsAppFab";
import { Cursor } from "@/app/components/site/Cursor";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grain">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <SmoothScroll>
        <SiteHeader />
        <main id="contenu">{children}</main>
        <SiteFooter />
      </SmoothScroll>
      <WhatsAppFab />
      <Cursor />
    </div>
  );
}
