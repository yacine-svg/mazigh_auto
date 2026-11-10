"use server";

import { revalidatePath, updateTag, refresh } from "next/cache";
import { requireShowroomOwner } from "@/app/data/admin-auth.server";
import { createClient } from "@/utils/supabase/server";
import type { CarCondition, CarFuel, CarStatus, CarTransmission } from "@/app/data/cars";
import type { CarSaleDetails } from "@/app/data/car-finances";
import { isCarImageStorageUrl } from "@/lib/car-images";

export type CarFormField =
  | "marque"
  | "modele"
  | "version"
  | "annee"
  | "prix"
  | "negotiable"
  | "kilometrage"
  | "carburant"
  | "boite"
  | "moteur"
  | "cylindree"
  | "puissance"
  | "couleur"
  | "type_carrosserie"
  | "etat"
  | "papiers"
  | "statut"
  | "is_featured"
  | "description"
  | "options"
  | "images"
  | "prix_achat"
  | "frais"
  | "finance_notes"
  | "slug";

export type AdminActionResult =
  | { success: true; carId?: string; message?: string }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<Record<CarFormField, string>>;
    };

function textValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export type UploadedImageItem = {
  url: string;
  is_cover: boolean;
  position: number;
};

function parseImageItems(value: string | null): UploadedImageItem[] | null {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item, index) => ({
      url: typeof item?.url === "string" ? item.url.trim() : "",
      is_cover: Boolean(item?.is_cover),
      position: typeof item?.position === "number" ? item.position : index,
    }));
  } catch {
    return null;
  }
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN;
}

function parseSaleDetails(value: FormDataEntryValue | null): CarSaleDetails | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const details = parsed as Partial<CarSaleDetails>;
    if (
      typeof details.prix_vente !== "number" ||
      typeof details.date_vente !== "string" ||
      typeof details.acheteur !== "string" ||
      typeof details.notes !== "string" ||
      typeof details.achat_inconnu !== "boolean" ||
      typeof details.frais_inconnus !== "boolean" ||
      (details.prix_achat !== null && typeof details.prix_achat !== "number") ||
      (details.frais !== null && typeof details.frais !== "number")
    ) {
      return null;
    }

    return details as CarSaleDetails;
  } catch {
    return null;
  }
}

function validateSaleDetails(details: CarSaleDetails): string | null {
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(details.date_vente) &&
    Number.isFinite(Date.parse(`${details.date_vente}T00:00:00Z`)) &&
    new Date(`${details.date_vente}T00:00:00Z`).toISOString().slice(0, 10) === details.date_vente;

  if (!Number.isFinite(details.prix_vente) || details.prix_vente < 0 || !validDate) {
    return "Saisissez un prix et une date de vente valides.";
  }
  if (
    (details.prix_achat === null && !details.achat_inconnu) ||
    (details.prix_achat !== null &&
      (!Number.isFinite(details.prix_achat) || details.prix_achat < 0)) ||
    (details.frais === null && !details.frais_inconnus) ||
    (details.frais !== null && (!Number.isFinite(details.frais) || details.frais < 0))
  ) {
    return "Indiquez le prix d'achat et les frais, ou choisissez « Je ne sais pas ».";
  }
  if (details.acheteur.length > 200 || details.notes.length > 5000) {
    return "Le nom de l'acheteur ou les notes sont trop longs.";
  }
  return null;
}

async function persistCarSaleStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  carId: string,
  nextStatus: "vendue" | "disponible",
  details: Pick<CarSaleDetails, "prix_achat" | "frais" | "notes"> & Partial<CarSaleDetails>,
  clearSaleData: boolean,
) {
  const { error } = await supabase.rpc("save_car_sale_status", {
    p_car_id: carId,
    p_next_status: nextStatus,
    p_prix_vente: details.prix_vente ?? null,
    p_date_vente: details.date_vente ?? null,
    p_prix_achat: details.prix_achat,
    p_frais: details.frais,
    p_acheteur: details.acheteur ?? null,
    p_notes: details.notes,
    p_clear_sale_data: clearSaleData,
  });

  if (error) {
    console.error("Atomic car sale update failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
  return true;
}

function extractStoragePath(url: string, bucket = "car-images"): string | null {
  try {
    if (!isCarImageStorageUrl(url)) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + marker.length));
    }
    return null;
  } catch {
    return null;
  }
}

export async function revalidateAllCarPaths(carId?: string, slug?: string) {
  try {
    updateTag("cars-list");
  } catch {
    // updateTag is available in Server Actions
  }
  try {
    refresh();
  } catch {
    // refresh client cache
  }

  revalidatePath("/admin", "page");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/voitures", "page");
  revalidatePath("/admin/finances", "page");
  revalidatePath("/voitures", "page");
  revalidatePath("/voitures", "layout");
  revalidatePath("/", "page");
  revalidatePath("/", "layout");

  if (carId) {
    revalidatePath(`/voitures/${carId}`, "page");
  }
  if (slug) {
    revalidatePath(`/voitures/${slug}`, "page");
  }
}

export async function createCarAction(formData: FormData): Promise<AdminActionResult> {
  await requireShowroomOwner();

  const marque = textValue(formData, "marque");
  const modele = textValue(formData, "modele");
  const version = textValue(formData, "version");
  const anneeStr = textValue(formData, "annee");
  const prixStr = textValue(formData, "prix");
  const negotiable = formData.get("negotiable") === "true" || formData.get("negotiable") === "on";
  const kilometrageStr = textValue(formData, "kilometrage");
  const carburant = (textValue(formData, "carburant") || "Essence") as CarFuel;
  const boite = (textValue(formData, "boite") || "Manuelle") as CarTransmission;
  const moteur = textValue(formData, "moteur");
  const cylindree = textValue(formData, "cylindree");
  const puissance = textValue(formData, "puissance");
  const couleur = textValue(formData, "couleur");
  const type_carrosserie = textValue(formData, "type_carrosserie") || "Berline";
  const etat = (textValue(formData, "etat") || "Occasion") as CarCondition;
  const papiers = textValue(formData, "papiers") || "Carte grise";
  const statut = (textValue(formData, "statut") || "disponible") as CarStatus;
  const is_featured = formData.get("is_featured") === "true" || formData.get("is_featured") === "on";
  const description = textValue(formData, "description");
  const slug = textValue(formData, "slug");
  const prixAchat = parseAmount(textValue(formData, "prix_achat"));
  const frais = parseAmount(textValue(formData, "frais"));
  const financeNotes = textValue(formData, "finance_notes");

  const options = parseJsonArray(textValue(formData, "optionsJson"));
  const images = parseImageItems(textValue(formData, "imagesJson"));

  const fieldErrors: Partial<Record<CarFormField, string>> = {};

  if (!marque) fieldErrors.marque = "La marque est obligatoire.";
  if (!modele) fieldErrors.modele = "Le modèle est obligatoire.";

  const annee = Number(anneeStr);
  if (!anneeStr || isNaN(annee) || annee < 1970 || annee > new Date().getFullYear() + 2) {
    fieldErrors.annee = "Saisissez une année valide.";
  }

  const prix = Number(prixStr);
  if (!prixStr || isNaN(prix) || prix < 0) {
    fieldErrors.prix = "Saisissez un prix valide en DA.";
  }

  const kilometrage = Number(kilometrageStr);
  if (!kilometrageStr || isNaN(kilometrage) || kilometrage < 0) {
    fieldErrors.kilometrage = "Saisissez un kilométrage valide.";
  }
  if (images === null || images.some((image) => !isCarImageStorageUrl(image.url))) {
    fieldErrors.images =
      "Chaque photo doit provenir du stockage Supabase. Ajoutez les photos depuis votre appareil.";
  }
  if (Number.isNaN(prixAchat)) fieldErrors.prix_achat = "Saisissez un prix d'achat valide.";
  if (Number.isNaN(frais)) fieldErrors.frais = "Saisissez un montant de frais valide.";
  if (financeNotes.length > 5000) fieldErrors.finance_notes = "Les notes privées sont trop longues.";
  if (statut === "vendue") {
    fieldErrors.statut = "Créez d'abord le véhicule, puis confirmez sa vente depuis sa fiche.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Veuillez corriger les erreurs indiquées dans le formulaire.",
      fieldErrors,
    };
  }

  const imageItems = images ?? [];

  try {
    const supabase = await createClient();

    // 1. Insert into cars
    const { data: newCar, error: carError } = await supabase
      .from("cars")
      .insert({
        marque,
        modele,
        version,
        annee,
        prix,
        negotiable,
        kilometrage,
        carburant,
        boite,
        moteur,
        cylindree,
        puissance,
        couleur,
        type_carrosserie,
        etat,
        papiers,
        statut,
        is_featured,
        description,
        options,
        slug: slug || null,
      })
      .select("id, slug")
      .single();

    if (carError || !newCar) {
      console.error("Error inserting car:", carError);
      return {
        success: false,
        message: carError?.message || "Impossible d'enregistrer le véhicule.",
      };
    }

    const { error: financeError } = await supabase.from("car_finances").upsert(
      {
        car_id: newCar.id,
        prix_achat: prixAchat,
        frais,
        notes: financeNotes || null,
      },
      { onConflict: "car_id" },
    );
    if (financeError) {
      console.error("Error saving private car finances:", {
        code: financeError.code,
        message: financeError.message,
      });
      const { error: rollbackError } = await supabase
        .from("cars")
        .delete()
        .eq("id", newCar.id);
      if (rollbackError) {
        console.error("Unable to roll back car after finance save failure:", {
          code: rollbackError.code,
          message: rollbackError.message,
        });
      }
      const failedUploadPaths = imageItems
        .map((image) => extractStoragePath(image.url))
        .filter((path): path is string => Boolean(path));
      if (failedUploadPaths.length > 0) {
        const { error: storageRollbackError } = await supabase.storage
          .from("car-images")
          .remove(failedUploadPaths);
        if (storageRollbackError) {
          console.error("Unable to clean up uploaded images after finance save failure:", {
            code: storageRollbackError.name,
            message: storageRollbackError.message,
          });
        }
      }
      return {
        success: false,
        message: "Impossible d'enregistrer les informations financières privées.",
      };
    }

    // 2. Insert images into car_images
    if (imageItems.length > 0) {
      const imagesToInsert = imageItems.map((img, idx) => ({
        car_id: newCar.id,
        url: img.url,
        position: idx,
        is_cover: img.is_cover || idx === 0,
      }));

      const { error: imgError } = await supabase.from("car_images").insert(imagesToInsert);
      if (imgError) {
        console.error("Error inserting car images:", imgError);
      }
    }

    await revalidateAllCarPaths(newCar.id, newCar.slug || slug || undefined);

    return {
      success: true,
      carId: newCar.id,
      message: "Véhicule ajouté avec succès !",
    };
  } catch (error) {
    console.error("createCarAction error:", error);
    return {
      success: false,
      message: "Une erreur inattendue est survenue lors de l'enregistrement.",
    };
  }
}

export async function updateCarAction(
  carId: string,
  formData: FormData
): Promise<AdminActionResult> {
  await requireShowroomOwner();

  const marque = textValue(formData, "marque");
  const modele = textValue(formData, "modele");
  const version = textValue(formData, "version");
  const anneeStr = textValue(formData, "annee");
  const prixStr = textValue(formData, "prix");
  const negotiable = formData.get("negotiable") === "true" || formData.get("negotiable") === "on";
  const kilometrageStr = textValue(formData, "kilometrage");
  const carburant = (textValue(formData, "carburant") || "Essence") as CarFuel;
  const boite = (textValue(formData, "boite") || "Manuelle") as CarTransmission;
  const moteur = textValue(formData, "moteur");
  const cylindree = textValue(formData, "cylindree");
  const puissance = textValue(formData, "puissance");
  const couleur = textValue(formData, "couleur");
  const type_carrosserie = textValue(formData, "type_carrosserie") || "Berline";
  const etat = (textValue(formData, "etat") || "Occasion") as CarCondition;
  const papiers = textValue(formData, "papiers") || "Carte grise";
  const statut = (textValue(formData, "statut") || "disponible") as CarStatus;
  const is_featured = formData.get("is_featured") === "true" || formData.get("is_featured") === "on";
  const description = textValue(formData, "description");
  const slug = textValue(formData, "slug");
  const prixAchat = parseAmount(textValue(formData, "prix_achat"));
  const frais = parseAmount(textValue(formData, "frais"));
  const financeNotes = textValue(formData, "finance_notes");

  const options = parseJsonArray(textValue(formData, "optionsJson"));
  const images = parseImageItems(textValue(formData, "imagesJson"));

  const fieldErrors: Partial<Record<CarFormField, string>> = {};

  if (!marque) fieldErrors.marque = "La marque est obligatoire.";
  if (!modele) fieldErrors.modele = "Le modèle est obligatoire.";

  const annee = Number(anneeStr);
  if (!anneeStr || isNaN(annee)) fieldErrors.annee = "Saisissez une année valide.";

  const prix = Number(prixStr);
  if (!prixStr || isNaN(prix) || prix < 0) fieldErrors.prix = "Saisissez un prix valide.";

  const kilometrage = Number(kilometrageStr);
  if (!kilometrageStr || isNaN(kilometrage) || kilometrage < 0) {
    fieldErrors.kilometrage = "Saisissez un kilométrage valide.";
  }
  if (images === null || images.some((image) => !isCarImageStorageUrl(image.url))) {
    fieldErrors.images =
      "Chaque photo doit provenir du stockage Supabase. Ajoutez les photos depuis votre appareil.";
  }
  if (Number.isNaN(prixAchat)) fieldErrors.prix_achat = "Saisissez un prix d'achat valide.";
  if (Number.isNaN(frais)) fieldErrors.frais = "Saisissez un montant de frais valide.";
  if (financeNotes.length > 5000) fieldErrors.finance_notes = "Les notes privées sont trop longues.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Veuillez corriger les erreurs indiquées.",
      fieldErrors,
    };
  }

  const imageItems = images ?? [];

  try {
    const supabase = await createClient();
    const { data: currentCar, error: currentCarError } = await supabase
      .from("cars")
      .select("statut")
      .eq("id", carId)
      .maybeSingle();

    if (currentCarError || !currentCar) {
      console.error("Unable to read car before update:", {
        code: currentCarError?.code,
        message: currentCarError?.message,
      });
      return { success: false, message: "Impossible de charger le véhicule à modifier." };
    }

    const saleTransition = currentCar.statut !== "vendue" && statut === "vendue";
    const saleReversal = currentCar.statut === "vendue" && statut === "disponible";
    const saleDetails = parseSaleDetails(formData.get("saleDetailsJson"));
    const clearSaleData = formData.get("clearSaleData") === "true";

    if (saleTransition && (!saleDetails || validateSaleDetails(saleDetails))) {
      return {
        success: false,
        message: saleDetails
          ? validateSaleDetails(saleDetails) ?? "Informations de vente invalides."
          : "Confirmez les informations de vente avant d'enregistrer.",
      };
    }
    if (saleReversal && formData.get("clearSaleData") !== "true" && formData.get("clearSaleData") !== "false") {
      return { success: false, message: "Confirmez le traitement des données de vente." };
    }

    // 1. Update car record
    const updatePayload: Record<string, unknown> = {
      marque,
      modele,
      version,
      annee,
      prix,
      negotiable,
      kilometrage,
      carburant,
      boite,
      moteur,
      cylindree,
      puissance,
      couleur,
      type_carrosserie,
      etat,
      papiers,
      is_featured,
      description,
      options,
      updated_at: new Date().toISOString(),
    };

    if (!saleTransition && !saleReversal) updatePayload.statut = statut;

    if (slug.trim()) {
      updatePayload.slug = slug.trim().toLowerCase();
    }

    const { data: updatedCar, error: carError } = await supabase
      .from("cars")
      .update(updatePayload)
      .eq("id", carId)
      .eq("statut", currentCar.statut)
      .select("id")
      .maybeSingle();

    if (carError || !updatedCar) {
      console.error("Error updating car:", carError);
      return {
        success: false,
        message: "Le véhicule n'a pas pu être mis à jour. Actualisez la page et réessayez.",
      };
    }

    if (saleTransition || saleReversal) {
      const sale = saleDetails ?? {
        prix_achat: prixAchat,
        frais,
        notes: financeNotes,
      };
      const saved = await persistCarSaleStatus(
        supabase,
        carId,
        saleTransition ? "vendue" : "disponible",
        {
          ...sale,
          prix_achat: saleTransition ? saleDetails!.prix_achat : prixAchat,
          frais: saleTransition ? saleDetails!.frais : frais,
          notes: saleTransition ? saleDetails!.notes : financeNotes,
        },
        saleReversal && clearSaleData,
      );
      if (!saved) {
        return {
          success: false,
          message: "La vente n'a pas pu être enregistrée. Le statut et les données de vente n'ont pas changé.",
        };
      }
    } else {
      const { error: financeError } = await supabase.from("car_finances").upsert(
        {
          car_id: carId,
          prix_achat: prixAchat,
          frais,
          notes: financeNotes || null,
        },
        { onConflict: "car_id" },
      );
      if (financeError) {
        console.error("Error updating private car finances:", {
          code: financeError.code,
          message: financeError.message,
        });
        return {
          success: false,
          message: "Impossible d'enregistrer les informations financières privées.",
        };
      }
    }

    // 2. Fetch existing images to clean up removed storage files
    const { data: existingImages } = await supabase
      .from("car_images")
      .select("url")
      .eq("car_id", carId);

    const newUrls = new Set(imageItems.map((img) => img.url));
    const removedUrls = (existingImages ?? [])
      .map((img) => img.url)
      .filter((url) => !newUrls.has(url));

    // Delete removed files from storage
    const storagePathsToRemove = removedUrls
      .map((url) => extractStoragePath(url, "car-images"))
      .filter((p): p is string => Boolean(p));

    if (storagePathsToRemove.length > 0) {
      await supabase.storage.from("car-images").remove(storagePathsToRemove);
    }

    // Replace images in car_images
    await supabase.from("car_images").delete().eq("car_id", carId);

    if (imageItems.length > 0) {
      const hasCover = imageItems.some((img) => img.is_cover);
      const imagesToInsert = imageItems.map((img, idx) => ({
        car_id: carId,
        url: img.url,
        position: idx,
        is_cover: hasCover ? img.is_cover : idx === 0,
      }));
      await supabase.from("car_images").insert(imagesToInsert);
    }

    await revalidateAllCarPaths(carId, slug || undefined);

    return { success: true, carId, message: "Véhicule mis à jour avec succès !" };
  } catch (error) {
    console.error("updateCarAction error:", error);
    return { success: false, message: "Erreur lors de la mise à jour." };
  }
}

export async function deleteCarAction(carId: string): Promise<AdminActionResult> {
  await requireShowroomOwner();

  try {
    const supabase = await createClient();

    // 1. Fetch image URLs before deleting the car row (car_images will cascade-delete in DB)
    const { data: images } = await supabase
      .from("car_images")
      .select("url")
      .eq("car_id", carId);

    const pathsToDelete = (images || [])
      .map((img) => extractStoragePath(img.url, "car-images"))
      .filter((p): p is string => Boolean(p));

    // 2. Delete the DB row FIRST
    const { error: dbError } = await supabase.from("cars").delete().eq("id", carId);

    if (dbError) {
      return { success: false, message: dbError.message };
    }

    // 3. Purge Storage files AFTER DB deletion has succeeded
    if (pathsToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("car-images")
        .remove(pathsToDelete);

      if (storageError) {
        console.warn("Storage files cleanup warning after car deletion:", storageError);
      }
    }

    await revalidateAllCarPaths(carId);

    return { success: true, message: "Véhicule supprimé avec succès." };
  } catch (error) {
    console.error("deleteCarAction error:", error);
    return { success: false, message: "Erreur lors de la suppression." };
  }
}

export async function updateCarStatusAction(
  carId: string,
  statut: CarStatus,
  saleDetails?: CarSaleDetails,
  clearSaleData?: boolean,
  privateFinance?: Pick<CarSaleDetails, "prix_achat" | "frais" | "notes">,
): Promise<AdminActionResult> {
  await requireShowroomOwner();

  try {
    const supabase = await createClient();
    const { data: currentCar, error: currentCarError } = await supabase
      .from("cars")
      .select("statut")
      .eq("id", carId)
      .maybeSingle();

    if (currentCarError || !currentCar) {
      console.error("Unable to read car before changing status:", {
        code: currentCarError?.code,
        message: currentCarError?.message,
      });
      return { success: false, message: "Impossible de charger le véhicule." };
    }

    const saleTransition = currentCar.statut !== "vendue" && statut === "vendue";
    const saleReversal = currentCar.statut === "vendue" && statut === "disponible";
    if (saleTransition && (!saleDetails || validateSaleDetails(saleDetails))) {
      return {
        success: false,
        message: saleDetails
          ? validateSaleDetails(saleDetails) ?? "Informations de vente invalides."
          : "Confirmez les informations de vente avant de continuer.",
      };
    }
    if (saleReversal && typeof clearSaleData !== "boolean") {
      return { success: false, message: "Confirmez le traitement des données de vente." };
    }

    if (saleTransition || saleReversal) {
      const saved = await persistCarSaleStatus(
        supabase,
        carId,
        saleTransition ? "vendue" : "disponible",
        saleDetails ?? privateFinance ?? { prix_achat: null, frais: null, notes: "" },
        saleReversal && Boolean(clearSaleData),
      );
      if (!saved) {
        return {
          success: false,
          message: "La vente n'a pas pu être enregistrée. Le statut et les données de vente n'ont pas changé.",
        };
      }
      await revalidateAllCarPaths(carId);
      return {
        success: true,
        message: saleTransition ? "Vente enregistrée." : "Statut mis à jour.",
      };
    }

    const { data: updatedCar, error } = await supabase
      .from("cars")
      .update({ statut, updated_at: new Date().toISOString() })
      .eq("id", carId)
      .eq("statut", currentCar.statut)
      .select("id")
      .maybeSingle();

    if (error || !updatedCar) {
      console.error("Error changing car status:", {
        code: error?.code,
        message: error?.message,
      });
      return {
        success: false,
        message: "Le statut n'a pas pu être modifié. Actualisez la page et réessayez.",
      };
    }

    await revalidateAllCarPaths(carId);

    return { success: true, message: "Statut mis à jour." };
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    return { success: false, message: "Erreur lors du changement de statut." };
  }
}

export async function toggleCarFeaturedAction(
  carId: string,
  currentFeatured: boolean
): Promise<AdminActionResult> {
  await requireShowroomOwner();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cars")
      .update({ is_featured: !currentFeatured, updated_at: new Date().toISOString() })
      .eq("id", carId);

    if (error) {
      return { success: false, message: error.message };
    }

    await revalidateAllCarPaths(carId);

    return { success: true, message: "Statut vedette mis à jour." };
  } catch (error) {
    console.error("Erreur lors de la modification vedette:", error);
    return { success: false, message: "Erreur lors de la modification." };
  }
}


