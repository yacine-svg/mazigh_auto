"use client";

import { useState } from "react";
import { buildSellOrExchangeWhatsAppUrl, SHOWROOM_CONFIG } from "@/lib/config";
import { CARBURANT_OPTIONS, BOITE_OPTIONS } from "@/app/data/cars";
import { BadgeDollarSign, RefreshCw, MessageCircle } from "lucide-react";

export function TradeInFormClient() {
  const [actionType, setActionType] = useState<"vente" | "echange">("vente");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [kilometrage, setKilometrage] = useState("");
  const [carburant, setCarburant] = useState("Essence");
  const [boite, setBoite] = useState("Manuelle");
  const [prixSouhaite, setPrixSouhaite] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildSellOrExchangeWhatsAppUrl({
      actionType,
      marque: marque.trim(),
      modele: modele.trim(),
      annee: annee.trim(),
      kilometrage: kilometrage.trim(),
      carburant,
      boite,
      prixSouhaite: prixSouhaite.trim(),
      details: details.trim(),
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7 rounded-[24px] border border-line bg-surface p-6 sm:p-9">
      {/* Radio Switch: Vente vs Échange */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line-2 bg-surface-2 p-1" role="group" aria-label="Type de demande">
        <button
          type="button"
          onClick={() => setActionType("vente")}
          aria-pressed={actionType === "vente"}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors sm:text-sm ${
            actionType === "vente" ? "bg-brand text-white" : "text-fg-3 hover:text-fg"
          }`}
        >
          <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
          <span>Vendre (cash)</span>
        </button>
        <button
          type="button"
          onClick={() => setActionType("echange")}
          aria-pressed={actionType === "echange"}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors sm:text-sm ${
            actionType === "echange" ? "bg-brand text-white" : "text-fg-3 hover:text-fg"
          }`}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Échanger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label">
            Marque de votre voiture <span className="req">*</span>
          </label>
          <input
            type="text"
            required
            value={marque}
            onChange={(e) => setMarque(e.target.value)}
            placeholder="ex: Renault, Volkswagen, Hyundai"
            className="field"
          />
        </div>

        <div>
          <label className="label">
            Modèle exact <span className="req">*</span>
          </label>
          <input
            type="text"
            required
            value={modele}
            onChange={(e) => setModele(e.target.value)}
            placeholder="ex: Clio 4 GT Line, Golf 7 TDI, Tucson"
            className="field"
          />
        </div>

        <div>
          <label className="label">
            Année de mise en circulation <span className="req">*</span>
          </label>
          <input
            type="number"
            required
            min={1990}
            max={SHOWROOM_CONFIG.copyrightYear + 1}
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            placeholder="ex: 2019"
            className="field"
          />
        </div>

        <div>
          <label className="label">
            Kilométrage actuel (km) <span className="req">*</span>
          </label>
          <input
            type="number"
            required
            min={0}
            value={kilometrage}
            onChange={(e) => setKilometrage(e.target.value)}
            placeholder="ex: 85000"
            className="field"
          />
        </div>

        <div>
          <label className="label">Carburant</label>
          <select
            value={carburant}
            onChange={(e) => setCarburant(e.target.value)}
            className="field"
          >
            {CARBURANT_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Boîte de vitesses</label>
          <select
            value={boite}
            onChange={(e) => setBoite(e.target.value)}
            className="field"
          >
            {BOITE_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            Prix souhaité en Dinars (DA)
          </label>
          <input
            type="text"
            value={prixSouhaite}
            onChange={(e) => setPrixSouhaite(e.target.value)}
            placeholder="ex: 2 400 000 ou À discuter"
            className="field"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label">
            État général & Remarques (Peinture, sbigha, retouches, carnet...)
          </label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Précisez si vous avez des retouches de peinture, état mécanique, pièces neuves ou le modèle recherché en cas d'échange..."
            className="field"
          />
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <button type="submit" className="btn btn-wa btn-lg btn-block">
          <MessageCircle aria-hidden="true" />
          <span>Envoyer sur WhatsApp pour estimation</span>
        </button>
        <p className="mt-3 text-center text-xs text-fg-3">
          Ce formulaire ouvre une conversation WhatsApp avec le showroom ({SHOWROOM_CONFIG.phoneDisplay}) contenant vos informations pré-remplies.
        </p>
      </div>
    </form>
  );
}
