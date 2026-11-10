"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/lib/image-compression";
import { SHOWROOM_CONFIG } from "@/lib/config";
import { CarImage } from "@/app/components/CarImage";
import type { CarFinance, CarSaleDetails } from "@/app/data/car-finances";
import {
  type Car,
  type CarCondition,
  type CarFuel,
  type CarStatus,
  type CarTransmission,
  BOITE_OPTIONS,
  CARBURANT_OPTIONS,
  CARROSSERIE_OPTIONS,
  ETAT_OPTIONS,
  PAPIERS_OPTIONS,
  POPULAR_FEATURES,
} from "@/app/data/cars";
import { createCarAction, updateCarAction, type CarFormField } from "./car-actions";
import { SaleConfirmationDialog } from "./SaleConfirmationDialog";
import { SaleReversalDialog } from "./SaleReversalDialog";
import {
  Car as CarIcon,
  Settings2,
  BadgeDollarSign,
  Camera,
  Upload,
  Sparkles,
  Check,
  CheckCheck,
  Plus,
  X,
  FileText,
  SlidersHorizontal,
  LockKeyhole,
} from "lucide-react";

const FORM_SECTIONS = [
  ["identification", "Identification", CarIcon],
  ["technique", "Technique", Settings2],
  ["prix", "Prix & publication", BadgeDollarSign],
  ["finances", "Privé", LockKeyhole],
  ["photos", "Photos", Camera],
  ["options", "Équipements", Sparkles],
  ["description", "Description", FileText],
  ["avance", "Avancé", SlidersHorizontal],
] as const;

type CarFormImageItem = {
  id: string; // internal unique key
  url: string;
  is_cover: boolean;
  position: number;
  isUploading?: boolean;
  progress?: number;
};

type CarFormClientProps = {
  initialCar?: Car;
  initialFinance?: CarFinance | null;
  mode: "create" | "edit";
};

export function CarFormClient({ initialCar, initialFinance, mode }: CarFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [marque, setMarque] = useState(initialCar?.marque || "");
  const [modele, setModele] = useState(initialCar?.modele || "");
  const [version, setVersion] = useState(initialCar?.version || "");
  const [annee, setAnnee] = useState(
    initialCar?.annee?.toString() || SHOWROOM_CONFIG.copyrightYear.toString()
  );
  const [prix, setPrix] = useState(initialCar?.prix?.toString() || "");
  const [negotiable, setNegotiable] = useState(initialCar?.negotiable ?? false);
  const [kilometrage, setKilometrage] = useState(initialCar?.kilometrage?.toString() || "");
  const [carburant, setCarburant] = useState<CarFuel>(initialCar?.carburant || "Essence");
  const [boite, setBoite] = useState<CarTransmission>(initialCar?.boite || "Manuelle");
  const [moteur, setMoteur] = useState(initialCar?.moteur || "");
  const [cylindree, setCylindree] = useState(initialCar?.cylindree || "");
  const [puissance, setPuissance] = useState(initialCar?.puissance || "");
  const [couleur, setCouleur] = useState(initialCar?.couleur || "");
  const [typeCarrosserie, setTypeCarrosserie] = useState(initialCar?.type_carrosserie || "Berline");
  const [etat, setEtat] = useState<CarCondition>(initialCar?.etat || "Occasion");
  const [papiers, setPapiers] = useState(initialCar?.papiers || "Carte grise (Safia)");
  const [statut, setStatut] = useState<CarStatus>(initialCar?.statut || "disponible");
  const [isFeatured, setIsFeatured] = useState(initialCar?.is_featured ?? false);
  const [description, setDescription] = useState(initialCar?.description || "");
  const [slug, setSlug] = useState(initialCar?.slug || "");
  const [prixAchat, setPrixAchat] = useState(
    initialFinance?.prix_achat == null ? "" : String(initialFinance.prix_achat),
  );
  const [frais, setFrais] = useState(
    initialFinance?.frais == null ? "" : String(initialFinance.frais),
  );
  const [financeNotes, setFinanceNotes] = useState(initialFinance?.notes || "");
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleDetails, setSaleDetails] = useState<CarSaleDetails | null>(null);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [clearSaleData, setClearSaleData] = useState<boolean | null>(null);

  // Options / Features
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialCar?.options || []);
  const [customOptionInput, setCustomOptionInput] = useState("");

  // Images state
  const initialImages: CarFormImageItem[] = (initialCar?.images || []).map((img, idx) => ({
    id: img.id || `init-${idx}`,
    url: img.url,
    is_cover: img.is_cover,
    position: img.position ?? idx,
  }));
  const [images, setImages] = useState<CarFormImageItem[]>(initialImages);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Errors & Feedback
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CarFormField, string>>>({});
  const [generalError, setGeneralError] = useState("");

  const handleStatusChange = (nextStatus: CarStatus) => {
    if (nextStatus === "vendue" && statut !== "vendue") {
      if (mode === "create") {
        setGeneralError("Créez d'abord le véhicule, puis confirmez sa vente depuis sa fiche.");
        return;
      }
      setSaleDialogOpen(true);
      return;
    }

    if (statut === "vendue" && nextStatus === "disponible") {
      setReversalDialogOpen(true);
      return;
    }

    setStatut(nextStatus);
  };

  const confirmSale = (details: CarSaleDetails) => {
    setPrixAchat(details.prix_achat == null ? "" : String(details.prix_achat));
    setFrais(details.frais == null ? "" : String(details.frais));
    setFinanceNotes(details.notes);
    setSaleDetails(details);
    setClearSaleData(null);
    setStatut("vendue");
    setSaleDialogOpen(false);
  };

  const confirmSaleReversal = (clear: boolean) => {
    setClearSaleData(clear);
    setStatut("disponible");
    setReversalDialogOpen(false);
  };

  // Toggle option tag
  const toggleOption = (opt: string) => {
    setSelectedOptions((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const allSuggestedOptionsSelected = POPULAR_FEATURES.every((option) =>
    selectedOptions.includes(option)
  );
  const toggleAllSuggestedOptions = () => {
    setSelectedOptions((prev) => {
      const allSelected = POPULAR_FEATURES.every((option) => prev.includes(option));
      return allSelected
        ? prev.filter((option) => !(POPULAR_FEATURES as readonly string[]).includes(option))
        : Array.from(new Set([...prev, ...POPULAR_FEATURES]));
    });
  };

  const addCustomOption = () => {
    const trimmed = customOptionInput.trim();
    if (trimmed && !selectedOptions.includes(trimmed)) {
      setSelectedOptions((prev) => [...prev, trimmed]);
      setCustomOptionInput("");
    }
  };

  // Upload files from device to Supabase Storage
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    setGeneralError("");
    const supabase = createClient();

    try {
      const newItems: CarFormImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setGeneralError(`Le fichier ${file.name} doit être au format JPG, PNG ou WebP.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setGeneralError(`Le fichier ${file.name} dépasse la limite de 10 Mo.`);
          continue;
        }

        // 1. Client-side compression
        const { file: compressed } = await compressImage(file);

        // 2. Generate clean storage path
        const randomKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const cleanExt = compressed.type === "image/webp" ? "webp" : "jpg";
        const filePath = `${randomKey}.${cleanExt}`;

        // 3. Upload to 'car-images' bucket
        const { data, error } = await supabase.storage
          .from("car-images")
          .upload(filePath, compressed, {
            contentType: compressed.type,
            upsert: false,
          });

        if (error) {
          console.error("Storage upload error:", error);
          setGeneralError(`Erreur lors de l'envoi de ${file.name}: ${error.message}`);
          continue;
        }

        // 4. Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("car-images").getPublicUrl(data.path);

        newItems.push({
          id: `upload-${Date.now()}-${i}`,
          url: publicUrl,
          is_cover: images.length === 0 && newItems.length === 0,
          position: images.length + newItems.length,
        });
      }

      setImages((prev) => [...prev, ...newItems]);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setGeneralError("Une erreur est survenue lors de l'envoi des photos.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleDeviceFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (!isUploadingFiles) {
      void uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      // If we removed the cover, set the first image as cover
      if (filtered.length > 0 && !filtered.some((img) => img.is_cover)) {
        filtered[0].is_cover = true;
      }
      return filtered.map((img, idx) => ({ ...img, position: idx }));
    });
  };

  const setCoverImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_cover: img.id === id,
      }))
    );
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((img, idx) => ({ ...img, position: idx }));
    });
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setFieldErrors({});

    // Client pre-validation
    const errors: Partial<Record<CarFormField, string>> = {};
    if (!marque.trim()) errors.marque = "La marque est obligatoire.";
    if (!modele.trim()) errors.modele = "Le modèle est obligatoire.";
    if (!annee || isNaN(Number(annee))) errors.annee = "L'année est invalide.";
    if (!prix || isNaN(Number(prix)) || Number(prix) < 0) errors.prix = "Le prix est invalide.";
    if (!kilometrage || isNaN(Number(kilometrage)) || Number(kilometrage) < 0) {
      errors.kilometrage = "Le kilométrage est invalide.";
    }
    if (prixAchat && (!Number.isFinite(Number(prixAchat)) || Number(prixAchat) < 0)) {
      errors.prix_achat = "Saisissez un prix d'achat valide.";
    }
    if (frais && (!Number.isFinite(Number(frais)) || Number(frais) < 0)) {
      errors.frais = "Saisissez un montant de frais valide.";
    }
    if (financeNotes.length > 5000) {
      errors.finance_notes = "Les notes privées sont trop longues.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError("Veuillez renseigner les champs obligatoires signalés en rouge.");
      return;
    }

    const formData = new FormData();
    formData.append("marque", marque.trim());
    formData.append("modele", modele.trim());
    formData.append("version", version.trim());
    formData.append("annee", annee.trim());
    formData.append("prix", prix.trim());
    formData.append("negotiable", String(negotiable));
    formData.append("kilometrage", kilometrage.trim());
    formData.append("carburant", carburant);
    formData.append("boite", boite);
    formData.append("moteur", moteur.trim());
    formData.append("cylindree", cylindree.trim());
    formData.append("puissance", puissance.trim());
    formData.append("couleur", couleur.trim());
    formData.append("type_carrosserie", typeCarrosserie);
    formData.append("etat", etat);
    formData.append("papiers", papiers);
    formData.append("statut", statut);
    formData.append("is_featured", String(isFeatured));
    formData.append("description", description.trim());
    formData.append("slug", slug.trim());
    formData.append("prix_achat", prixAchat.trim());
    formData.append("frais", frais.trim());
    formData.append("finance_notes", financeNotes.trim());
    if (saleDetails && statut === "vendue") {
      formData.append("saleDetailsJson", JSON.stringify(saleDetails));
    }
    if (clearSaleData !== null && statut === "disponible") {
      formData.append("clearSaleData", String(clearSaleData));
    }
    formData.append("optionsJson", JSON.stringify(selectedOptions));
    formData.append(
      "imagesJson",
      JSON.stringify(
        images.map((img, idx) => ({
          url: img.url,
          is_cover: img.is_cover,
          position: idx,
        }))
      )
    );

    startTransition(async () => {
      let result;
      if (mode === "edit" && initialCar) {
        result = await updateCarAction(initialCar.id, formData);
      } else {
        result = await createCarAction(formData);
      }

      if (result.success) {
        router.refresh();
        router.replace(mode === "edit" ? `/admin/voitures?updated=${Date.now()}` : `/admin/voitures?created=${Date.now()}`);
      } else {
        setGeneralError(result.message || "Une erreur est survenue lors de l'enregistrement.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-5 xl:grid-cols-[210px_minmax(0,1fr)]">
      <nav className="form-nav sticky top-20 hidden xl:grid" aria-label="Sections du formulaire">
        <p className="adm-sb-label !px-2.5">Sections</p>
        {FORM_SECTIONS.map(([sid, label, Icon]) => (
          <a key={sid} href={`#form-${sid}`}>
            <Icon aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <div className="min-w-0 space-y-4">
      {generalError && (
        <div className="alert alert-bad" role="alert">
          {generalError}
        </div>
      )}

      {/* SECTION 1: IDENTIFICATION */}
      <div id="form-identification" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <CarIcon className="h-[1.1rem] w-[1.1rem] text-brand" /> Identification du Véhicule
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="label">
              Marque <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              placeholder="ex: Volkswagen, BMW, Renault"
              className="field"
              aria-invalid={Boolean(fieldErrors.marque)}
            />
            {fieldErrors.marque && <p className="field-error">{fieldErrors.marque}</p>}
          </div>

          <div>
            <label className="label">
              Modèle <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={modele}
              onChange={(e) => setModele(e.target.value)}
              placeholder="ex: Golf 8, 320d, Clio 4"
              className="field"
              aria-invalid={Boolean(fieldErrors.modele)}
            />
            {fieldErrors.modele && <p className="field-error">{fieldErrors.modele}</p>}
          </div>

          <div>
            <label className="label">Version / Finition</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="ex: R-Line, GTD, M Sport, GT Line"
              className="field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="label">
              Année <span className="req">*</span>
            </label>
            <input
              type="number"
              required
              min={1970}
              max={SHOWROOM_CONFIG.copyrightYear + 2}
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="label">Carrosserie</label>
            <select
              value={typeCarrosserie}
              onChange={(e) => setTypeCarrosserie(e.target.value)}
              className="field"
            >
              {CARROSSERIE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">État</label>
            <select
              value={etat}
              onChange={(e) => setEtat(e.target.value as CarCondition)}
              className="field"
            >
              {ETAT_OPTIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Papiers</label>
            <select
              value={papiers}
              onChange={(e) => setPapiers(e.target.value)}
              className="field"
            >
              {PAPIERS_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: MOTORISATION & TECHNIQUE */}
      <div id="form-technique" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <Settings2 className="h-[1.1rem] w-[1.1rem] text-brand" /> Caractéristiques Techniques
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="label">
              Kilométrage (km) <span className="req">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={kilometrage}
              onChange={(e) => setKilometrage(e.target.value)}
              placeholder="ex: 45000"
              className="field"
            />
          </div>

          <div>
            <label className="label">
              Carburant <span className="req">*</span>
            </label>
            <select
              value={carburant}
              onChange={(e) => setCarburant(e.target.value as CarFuel)}
              className="field"
            >
              {CARBURANT_OPTIONS.map((fuel) => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Boîte de vitesses <span className="req">*</span>
            </label>
            <select
              value={boite}
              onChange={(e) => setBoite(e.target.value as CarTransmission)}
              className="field"
            >
              {BOITE_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="label">Moteur</label>
            <input
              type="text"
              value={moteur}
              onChange={(e) => setMoteur(e.target.value)}
              placeholder="ex: 2.0 TDI, 1.6 HDi"
              className="field"
            />
          </div>

          <div>
            <label className="label">Cylindrée</label>
            <input
              type="text"
              value={cylindree}
              onChange={(e) => setCylindree(e.target.value)}
              placeholder="ex: 1.6L ou 1968 cc"
              className="field"
            />
          </div>

          <div>
            <label className="label">Puissance</label>
            <input
              type="text"
              value={puissance}
              onChange={(e) => setPuissance(e.target.value)}
              placeholder="ex: 150 ch ou 7 CV"
              className="field"
            />
          </div>

          <div>
            <label className="label">Couleur</label>
            <input
              type="text"
              value={couleur}
              onChange={(e) => setCouleur(e.target.value)}
              placeholder="ex: Noir, Gris Nardo, Blanc"
              className="field"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PRIX, STATUT & PUBLICATION */}
      <div id="form-prix" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <BadgeDollarSign className="h-[1.1rem] w-[1.1rem] text-brand" /> Prix & Publication
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="label">
              Prix (en Dinars Algériens - DA) <span className="req">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="ex: 3500000"
              className="field font-semibold"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="check">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span>Prix Négociable</span>
            </label>
          </div>

          <div>
            <label className="label">
              Statut d&apos;affichage <span className="req">*</span>
            </label>
            <select
              value={statut}
              onChange={(e) => handleStatusChange(e.target.value as CarStatus)}
              className="field"
            >
              <option value="disponible">Disponible (visible sur le site)</option>
              <option value="reservee">Réservée (badge réservée)</option>
              <option value="vendue" disabled={mode === "create"}>
                Vendue (badge vendue)
              </option>
              <option value="brouillon">Brouillon (invisible au public)</option>
            </select>
            {fieldErrors.statut && (
              <p className="field-error" role="alert">{fieldErrors.statut}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <label className="check">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-[var(--warn)]"
            />
            <span className="font-semibold text-warn">★ Afficher en vedette sur la page d&apos;accueil</span>
          </label>
        </div>
      </div>

      {/* SECTION 4: INFORMATIONS FINANCIÈRES PRIVÉES */}
      <div id="form-finances" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6" style={{ borderColor: "color-mix(in srgb, var(--warn) 35%, var(--line))" }}>
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <LockKeyhole className="h-[1.1rem] w-[1.1rem] text-warn" />
          Informations privées (invisibles pour les clients)
        </h2>
        <p className="text-xs text-fg-3">
          Ces données sont réservées à l&apos;administration et ne sont jamais affichées sur le site public.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="car-purchase-price" className="label">Prix d&apos;achat (DA)</label>
            <input
              id="car-purchase-price"
              type="number"
              min="0"
              step="1"
              disabled={Boolean(saleDetails?.achat_inconnu && statut === "vendue")}
              value={prixAchat}
              onChange={(event) => {
                const value = event.target.value;
                setPrixAchat(value);
                setSaleDetails((previous) =>
                  previous
                    ? {
                        ...previous,
                        prix_achat: value === "" ? null : Number(value),
                        achat_inconnu: value === "" ? previous.achat_inconnu : false,
                      }
                    : previous,
                );
              }}
              className="field"
            />
            {fieldErrors.prix_achat && (
              <span className="field-error block" role="alert">{fieldErrors.prix_achat}</span>
            )}
            {saleDetails && statut === "vendue" && (
              <label className="check !text-xs">
                <input
                  type="checkbox"
                  checked={saleDetails.achat_inconnu}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    if (checked) setPrixAchat("");
                    setSaleDetails((previous) =>
                      previous
                        ? {
                            ...previous,
                            achat_inconnu: checked,
                            prix_achat: checked ? null : previous.prix_achat,
                          }
                        : previous,
                    );
                  }}
                />
                Je ne sais pas
              </label>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="car-fees" className="label">Frais (réparations, papiers) (DA)</label>
            <input
              id="car-fees"
              type="number"
              min="0"
              step="1"
              disabled={Boolean(saleDetails?.frais_inconnus && statut === "vendue")}
              value={frais}
              onChange={(event) => {
                const value = event.target.value;
                setFrais(value);
                setSaleDetails((previous) =>
                  previous
                    ? {
                        ...previous,
                        frais: value === "" ? null : Number(value),
                        frais_inconnus: value === "" ? previous.frais_inconnus : false,
                      }
                    : previous,
                );
              }}
              className="field"
            />
            {fieldErrors.frais && (
              <span className="field-error block" role="alert">{fieldErrors.frais}</span>
            )}
            {saleDetails && statut === "vendue" && (
              <label className="check !text-xs">
                <input
                  type="checkbox"
                  checked={saleDetails.frais_inconnus}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    if (checked) setFrais("");
                    setSaleDetails((previous) =>
                      previous
                        ? {
                            ...previous,
                            frais_inconnus: checked,
                            frais: checked ? null : previous.frais,
                          }
                        : previous,
                    );
                  }}
                />
                Je ne sais pas
              </label>
            )}
          </div>
          <label className="md:col-span-2">
            <span className="label">Notes privées</span>
            <textarea
              rows={3}
              maxLength={5000}
              value={financeNotes}
              onChange={(event) => {
                setFinanceNotes(event.target.value);
                setSaleDetails((previous) =>
                  previous ? { ...previous, notes: event.target.value } : previous,
                );
              }}
              className="field"
            />
            {fieldErrors.finance_notes && (
              <span className="field-error block" role="alert">{fieldErrors.finance_notes}</span>
            )}
          </label>
        </div>
      </div>

      {/* SECTION 5: PHOTOS & GALERIE */}
      <div id="form-photos" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 text-base font-semibold">
          <span className="flex items-center gap-2">
            <Camera className="h-[1.1rem] w-[1.1rem] text-brand" /> Ajouter des photos ({images.length})
          </span>
          <span className="text-xs text-fg-3 font-normal">Formats : JPG, PNG, WebP (max 10 Mo)</span>
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFiles(true);
          }}
          onDragLeave={() => setIsDraggingFiles(false)}
          onDrop={handleFileDrop}
          className={`space-y-4 rounded-2xl border-2 border-dashed bg-surface-2 p-8 text-center transition-colors ${
            isDraggingFiles ? "border-brand bg-brand-soft" : "border-line-2 hover:border-brand"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleDeviceFilesSelected}
            className="hidden"
            id="car-device-file-input"
          />

          <div className="space-y-2">
            <p className="text-sm text-fg-2 font-medium">
              Déposez vos photos ici ou choisissez-les depuis votre appareil
            </p>
            <p className="text-xs text-fg-3">
              Compression automatique avant l&apos;envoi vers Supabase Storage pour un affichage ultra rapide
            </p>
          </div>

          <label
            htmlFor="car-device-file-input"
            className={`btn btn-primary cursor-pointer ${
              isUploadingFiles ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploadingFiles ? (
              "Envoi et compression en cours..."
            ) : (
              <>
                <Upload aria-hidden="true" />
                Choisir des photos
              </>
            )}
          </label>
        </div>

        {fieldErrors.images && (
          <p className="field-error" role="alert">{fieldErrors.images}</p>
        )}

        {/* Uploaded Gallery Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative rounded-xl overflow-hidden bg-surface-3 border-2 transition-all group ${
                  img.is_cover ? "border-brand ring-2 ring-brand/30" : "border-line-2"
                }`}
              >
                <div className="aspect-video relative">
                  <CarImage
                    src={img.url}
                    alt={`Vue ${index + 1}`}
                    fill
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Cover badge */}
                {img.is_cover && (
                  <span className="pill no-dot absolute left-2 top-2 border-transparent bg-brand text-fg">
                    Couverture
                  </span>
                )}

                {/* Controls Overlay */}
                <div className="p-2 bg-surface-2 flex items-center justify-between text-xs border-t border-line-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveImage(index, "up")}
                      className="px-1.5 py-0.5 bg-surface-3 rounded hover:bg-line-2 disabled:opacity-30"
                      title="Déplacer vers la gauche"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, "down")}
                      className="px-1.5 py-0.5 bg-surface-3 rounded hover:bg-line-2 disabled:opacity-30"
                      title="Déplacer vers la droite"
                    >
                      →
                    </button>
                  </div>

                  {!img.is_cover && (
                    <button
                      type="button"
                      onClick={() => setCoverImage(img.id)}
                      className="text-[10px] text-fg-2 hover:text-brand underline"
                    >
                      Définir couv.
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="text-bad hover:text-bad font-bold p-1 rounded hover:bg-bad-soft"
                    title="Supprimer la photo"
                    aria-label="Supprimer la photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 6: OPTIONS & ÉQUIPEMENTS */}
      <div id="form-options" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <Sparkles className="h-[1.1rem] w-[1.1rem] text-brand" /> Équipements & Options
        </h2>

        <button
          type="button"
          onClick={toggleAllSuggestedOptions}
          className="btn btn-ghost btn-sm touch-manipulation inline-flex items-center gap-1.5"
        >
          {allSuggestedOptionsSelected ? (
            <>
              <X className="w-4 h-4" />
              Tout désélectionner
            </>
          ) : (
            <>
              <CheckCheck className="w-4 h-4" />
              Toutes les options
            </>
          )}
        </button>

        {/* Chips Grid */}
        <div className="flex flex-wrap gap-2.5">
          {POPULAR_FEATURES.map((opt) => {
            const selected = selectedOptions.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                aria-pressed={selected}
                className="chip touch-manipulation"
              >
                {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 opacity-60" />}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Option Input */}
        <div className="flex gap-2 max-w-md pt-2">
          <input
            type="text"
            value={customOptionInput}
            onChange={(e) => setCustomOptionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomOption();
              }
            }}
            placeholder="Ajouter une option personnalisée..."
            className="field field-sm flex-1"
          />
          <button
            type="button"
            onClick={addCustomOption}
            className="btn btn-ghost btn-sm touch-manipulation"
          >
            Ajouter
          </button>
        </div>

        {/* Custom options list */}
        {selectedOptions.filter((o) => !(POPULAR_FEATURES as readonly string[]).includes(o)).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedOptions
              .filter((o) => !(POPULAR_FEATURES as readonly string[]).includes(o))
              .map((custom) => (
                <span
                  key={custom}
                  className="pill no-dot status-badge-vendue !h-auto !py-1 normal-case tracking-normal"
                >
                  {custom}
                  <button
                    type="button"
                    onClick={() => toggleOption(custom)}
                    className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center hover:text-fg"
                    aria-label={`Supprimer ${custom}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* SECTION 7: DESCRIPTION & REMARQUES SUR L'ÉTAT */}
      <div id="form-description" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <FileText className="h-[1.1rem] w-[1.1rem] text-brand" /> Description & État (Accidents, Retouches, etc.)
        </h2>
        <p className="text-xs text-fg-3">
          Détaillez ici l&apos;état exact du véhicule : présence de retouches de peinture (sbigha), pièces changées, carnet d&apos;entretien, état des pneus ou tout détail important pour l&apos;acheteur.
        </p>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Première main, carnet d'entretien à jour. Zéro retouche de peinture, suspension neuve, pneus neufs. Rien à prévoir..."
          className="field"
        />
      </div>

      {/* SECTION 8: PARAMÈTRES AVANCÉS */}
      <div id="form-avance" className="panel scroll-mt-24 space-y-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 border-b border-line pb-4 text-base font-semibold">
          <SlidersHorizontal className="h-[1.1rem] w-[1.1rem] text-brand" /> Paramètres avancés (Optionnel)
        </h2>
        <div>
          <label className="label">
            Identifiant d&apos;URL personnalisé (Slug)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Laisser vide pour générer automatiquement (ex: volkswagen-golf-8-2022)"
            className="field font-mono text-xs"
          />
          <p className="text-[11px] text-fg-3 mt-1">
            Si laissé vide, le système créera automatiquement un slug propre basé sur la marque, le modèle et l&apos;année.
          </p>
        </div>
      </div>

      {/* SUBMIT BUTTON BAR */}
      <div className="panel sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 p-3 shadow-[var(--shadow-lg)] backdrop-blur">
        <Link href="/admin/voitures" className="btn btn-ghost">
          Annuler
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-fg-3 sm:inline">
            {images.length} photo{images.length !== 1 ? "s" : ""} · {selectedOptions.length} option{selectedOptions.length !== 1 ? "s" : ""}
          </span>
          <button type="submit" disabled={isPending || isUploadingFiles} className="btn btn-primary btn-lg">
            {isPending
              ? "Enregistrement en cours…"
              : mode === "edit"
              ? "Mettre à jour la voiture"
              : "Créer et publier la voiture"}
          </button>
        </div>
      </div>
      </div>

      {saleDialogOpen && initialCar && (
        <SaleConfirmationDialog
          key={initialCar.id}
          listedPrice={prix.trim() ? Number(prix) : initialCar.prix}
          initialFinance={{
            car_id: initialCar.id,
            prix_achat: prixAchat ? Number(prixAchat) : null,
            frais: frais ? Number(frais) : null,
            prix_vente: initialFinance?.prix_vente ?? null,
            date_vente: initialFinance?.date_vente ?? null,
            acheteur: initialFinance?.acheteur ?? null,
            notes: financeNotes,
          }}
          pending={isPending}
          onCancel={() => setSaleDialogOpen(false)}
          onConfirm={confirmSale}
        />
      )}
      {reversalDialogOpen && (
        <SaleReversalDialog
          pending={isPending}
          onCancel={() => setReversalDialogOpen(false)}
          onChoose={confirmSaleReversal}
        />
      )}
    </form>
  );
}
