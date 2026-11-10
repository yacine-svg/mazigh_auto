// PREVIEW-DEMO BRANCH ONLY: sample cars so the redesign can be previewed without Supabase.
import type { Car, CarImage } from "./cars";
import type { CarFinance } from "./car-finances";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

type Seed = [string, string, string, number, number, number, Car["carburant"], Car["boite"], Car["statut"], boolean, string, string, string[]];

const SEEDS: Seed[] = [
  ["Volkswagen", "Golf 8", "GTD", 2022, 6900000, 38000, "Diesel", "Automatique", "disponible", true, "Berline", "Blanc", ["photo-1630019499081-50ed7838a1cd", "photo-1634690218629-16ffd0a7ae5d"]],
  ["Mercedes-Benz", "Classe C", "AMG Line", 2021, 11500000, 46000, "Diesel", "Automatique", "disponible", true, "Berline", "Blanc", ["photo-1605556816125-d752c226247b", "photo-1551836989-b4622a17a792", "photo-1625690180114-5530b1304127"]],
  ["Toyota", "Land Cruiser", "VX", 2020, 16800000, 72000, "Diesel", "Automatique", "reservee", true, "SUV", "Noir", ["photo-1650530579355-7ad9d4766043", "photo-1554841649-de947c4b954a", "photo-1637189315455-3e7e629a05b9"]],
  ["Renault", "Clio 5", "RS Line", 2023, 3950000, 12000, "Essence", "Manuelle", "disponible", false, "Citadine", "Rouge", ["photo-1565786089437-496904c48734"]],
  ["Hyundai", "Tucson", "Prestige", 2021, 7200000, 52000, "Diesel", "Automatique", "disponible", false, "SUV", "Blanc", ["photo-1603094543704-64cdce2d2532"]],
  ["Land Rover", "Range Rover Sport", "HSE", 2019, 19500000, 88000, "Diesel", "Automatique", "disponible", false, "SUV", "Noir", ["photo-1563458563737-e60b1f1b345f", "photo-1602013871952-8379f19a15f1", "photo-1740695600568-a7e54e7d3614"]],
  ["BMW", "M3", "Competition", 2022, 21000000, 21000, "Essence", "Automatique", "disponible", false, "Berline", "Noir", ["photo-1625690096555-a0a4d190901c", "photo-1584936684506-c3a7086e8212"]],
  ["Audi", "A4", "S line", 2018, 5400000, 118000, "Diesel", "Automatique", "disponible", false, "Berline", "Gris", ["photo-1556391362-d3d11d98e510", "photo-1540066019607-e5f69323a8dc"]],
  ["Peugeot", "208", "Allure", 2020, 3300000, 64000, "Essence", "Manuelle", "vendue", false, "Citadine", "Gris", ["photo-1571388429034-9ce53dbf0047", "photo-1563456162079-bdcab0fe5f2f"]],
  ["Mercedes-Benz", "Classe E", "Avantgarde", 2019, 9800000, 95000, "Diesel", "Automatique", "vendue", false, "Berline", "Noir", ["photo-1618373444305-3a77b7719a59", "photo-1542230387-bfc77d26903e"]],
  ["Mercedes-Benz", "Vito", "Tourer", 2021, 8200000, 60000, "Diesel", "Manuelle", "vendue", false, "Utilitaire", "Noir", ["photo-1765461734605-34657fa04db2"]],
  ["Volkswagen", "Transporter", "T6", 2017, 4600000, 160000, "Diesel", "Manuelle", "brouillon", false, "Utilitaire", "Bleu", ["photo-1638313929075-07b292785dd7"]],
];

const DAY = 86_400_000;
const AGES = [8, 15, 70, 4, 52, 95, 22, 64, 30, 40, 75, 2];

export const MOCK_CARS: Car[] = SEEDS.map((s, i) => {
  const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  const images: CarImage[] = s[12].map((photo, p) => ({ id: `${id}-${p}`, car_id: id, url: u(photo), position: p, is_cover: p === 0 }));
  return {
    id,
    created_at: new Date(Date.now() - AGES[i] * DAY).toISOString(),
    marque: s[0],
    modele: s[1],
    version: s[2],
    annee: s[3],
    prix: s[4],
    negotiable: i % 3 === 0,
    kilometrage: s[5],
    carburant: s[6],
    boite: s[7],
    moteur: s[6] === "Diesel" ? "2.0 TDI" : "1.5 TSI",
    cylindree: s[6] === "Diesel" ? "1968 cm³" : "1498 cm³",
    puissance: "150 ch",
    couleur: s[11],
    type_carrosserie: s[10],
    options: ["Caméra de recul", "Apple CarPlay", "Phares Full LED", "Régulateur de vitesse", "Climatisation automatique"],
    description: "Première main, carnet d'entretien à jour. Aucune retouche de peinture, pneus récents.",
    etat: "Occasion",
    papiers: "Carte grise (Safia)",
    statut: s[8],
    is_featured: s[9],
    slug: `${s[0]}-${s[1]}-${s[3]}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-"),
    images,
    cover_image_url: images[0]?.url ?? "",
  };
});

const SOLD_DAYS_AGO: Record<number, number> = { 8: 6, 9: 38, 10: 70 };

export const MOCK_FINANCES: CarFinance[] = MOCK_CARS.map((c, i) => ({
  car_id: c.id,
  prix_achat: Math.round((c.prix * 0.87) / 10000) * 10000,
  frais: i === 10 ? null : 120000,
  prix_vente: c.statut === "vendue" ? c.prix - 100000 : null,
  date_vente: c.statut === "vendue" ? new Date(Date.now() - SOLD_DAYS_AGO[i] * DAY).toISOString().slice(0, 10) : null,
  acheteur: null,
  notes: null,
}));
