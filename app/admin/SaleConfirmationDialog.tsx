"use client";

import { useState } from "react";
import { formatPriceDZD } from "@/app/data/cars";
import type { CarFinance, CarSaleDetails } from "@/app/data/car-finances";

type SaleConfirmationDialogProps = {
  listedPrice: number;
  initialFinance?: CarFinance | null;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (details: CarSaleDetails) => void;
};

function todayInAlgiers() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function SaleConfirmationDialog({
  listedPrice,
  initialFinance,
  pending = false,
  onCancel,
  onConfirm,
}: SaleConfirmationDialogProps) {
  const [salePrice, setSalePrice] = useState(String(listedPrice));
  const [saleDate, setSaleDate] = useState(todayInAlgiers);
  const [purchasePrice, setPurchasePrice] = useState(
    initialFinance?.prix_achat == null ? "" : String(initialFinance.prix_achat),
  );
  const [fees, setFees] = useState(
    initialFinance?.frais == null ? "" : String(initialFinance.frais),
  );
  const [purchaseUnknown, setPurchaseUnknown] = useState(false);
  const [feesUnknown, setFeesUnknown] = useState(false);
  const [buyer, setBuyer] = useState(initialFinance?.acheteur ?? "");
  const [notes, setNotes] = useState(initialFinance?.notes ?? "");
  const [error, setError] = useState("");

  const saleValue = Number(salePrice);
  const purchaseValue = Number(purchasePrice);
  const feesValue = Number(fees);
  const profit =
    Number.isFinite(saleValue) &&
    salePrice !== "" &&
    !purchaseUnknown &&
    purchasePrice !== "" &&
    Number.isFinite(purchaseValue) &&
    !feesUnknown &&
    fees !== "" &&
    Number.isFinite(feesValue)
      ? saleValue - purchaseValue - feesValue
      : null;

  const handleConfirm = () => {
    if (
      salePrice === "" ||
      !Number.isFinite(saleValue) ||
      saleValue < 0 ||
      !saleDate ||
      (!purchaseUnknown &&
        (purchasePrice === "" || !Number.isFinite(purchaseValue) || purchaseValue < 0)) ||
      (!feesUnknown && (fees === "" || !Number.isFinite(feesValue) || feesValue < 0))
    ) {
      setError("Saisissez des montants valides ou choisissez « Je ne sais pas » pour les coûts inconnus.");
      return;
    }

    onConfirm({
      prix_achat: purchaseUnknown ? null : purchaseValue,
      frais: feesUnknown ? null : feesValue,
      prix_vente: saleValue,
      date_vente: saleDate,
      acheteur: buyer.trim(),
      notes: notes.trim(),
      achat_inconnu: purchaseUnknown,
      frais_inconnus: feesUnknown,
    });
  };

  return (
    <div className="dialog-backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="sale-dialog-title" className="dialog !max-w-xl" data-lenis-prevent>
        <div className="dialog-head">
          <span className="pill status-badge-vendue">Vente</span>
          <h2 id="sale-dialog-title" className="mt-3">Marquer comme vendue</h2>
          <p className="mt-1 text-sm text-fg-3">Prix affiché : {formatPriceDZD(listedPrice)}</p>
        </div>

        <div className="dialog-body grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Prix de vente (DA)</span>
            <input type="number" min="0" step="1" required value={salePrice} onChange={(event) => setSalePrice(event.target.value)} className="field" />
          </label>
          <label>
            <span className="label">Date de vente</span>
            <input type="date" required value={saleDate} onChange={(event) => setSaleDate(event.target.value)} className="field" />
          </label>
          <div>
            <label htmlFor="sale-purchase-price" className="label">Prix d&apos;achat (DA)</label>
            <input
              id="sale-purchase-price"
              type="number"
              min="0"
              step="1"
              disabled={purchaseUnknown}
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              className="field"
            />
            <label className="check mt-2 !text-xs">
              <input type="checkbox" checked={purchaseUnknown} onChange={(event) => setPurchaseUnknown(event.target.checked)} />
              Je ne sais pas
            </label>
          </div>
          <div>
            <label htmlFor="sale-fees" className="label">Frais (DA)</label>
            <input
              id="sale-fees"
              type="number"
              min="0"
              step="1"
              disabled={feesUnknown}
              value={fees}
              onChange={(event) => setFees(event.target.value)}
              className="field"
            />
            <label className="check mt-2 !text-xs">
              <input type="checkbox" checked={feesUnknown} onChange={(event) => setFeesUnknown(event.target.checked)} />
              Je ne sais pas
            </label>
          </div>
          <label className="sm:col-span-2">
            <span className="label">Acheteur (facultatif)</span>
            <input value={buyer} onChange={(event) => setBuyer(event.target.value)} maxLength={200} className="field" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Notes privées (facultatif)</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} rows={3} className="field" />
          </label>

          <div
            className={`flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 sm:col-span-2 ${
              profit === null ? "text-fg-3" : profit > 0 ? "text-ok" : profit < 0 ? "text-bad" : "text-fg"
            }`}
            aria-live="polite"
          >
            <span className="text-sm text-fg-2">Bénéfice prévisionnel</span>
            <strong className="mono">{profit === null ? "coût manquant" : formatPriceDZD(profit)}</strong>
          </div>

          {error && (
            <p className="alert alert-bad sm:col-span-2" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="dialog-foot">
          <button type="button" disabled={pending} onClick={onCancel} className="btn btn-ghost">
            Annuler
          </button>
          <button type="button" disabled={pending} onClick={handleConfirm} className="btn btn-primary">
            {pending ? "Enregistrement…" : "Confirmer la vente"}
          </button>
        </div>
      </section>
    </div>
  );
}
