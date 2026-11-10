"use client";

import { RotateCcw } from "lucide-react";

type SaleReversalDialogProps = {
  pending?: boolean;
  onCancel: () => void;
  onChoose: (clearSaleData: boolean) => void;
};

export function SaleReversalDialog({ pending = false, onCancel, onChoose }: SaleReversalDialogProps) {
  return (
    <div className="dialog-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="sale-reversal-title" className="dialog !max-w-md">
        <div className="dialog-head">
          <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-warn-soft text-warn">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="sale-reversal-title">Annuler la vente ?</h2>
        </div>
        <p className="dialog-body text-sm text-fg-2">
          La voiture repassera au statut disponible. Souhaitez-vous effacer ses données de vente ?
        </p>
        <div className="dialog-foot">
          <button type="button" disabled={pending} onClick={onCancel} className="btn btn-ghost">
            Annuler
          </button>
          <button type="button" disabled={pending} onClick={() => onChoose(false)} className="btn btn-ghost">
            Conserver les données
          </button>
          <button type="button" disabled={pending} onClick={() => onChoose(true)} className="btn btn-primary">
            Effacer les données
          </button>
        </div>
      </section>
    </div>
  );
}
