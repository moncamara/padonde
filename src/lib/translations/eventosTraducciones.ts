// 🌍 Capa de Traducción de Contenido Dinámico de Eventos para PaDónde
// Proporciona traducciones nativas y fluidas (EN, DE, FR) para los eventos activos en Minca.
// Si el idioma es Español ("es") o no existe traducción para un evento, hace fallback
// transparente al texto original sin alterar ningún dato de la base de datos.

import { limpiarDescripcionRecurrencia, extraerRecurrencia } from "@/lib/utils";

export interface EventoTraduccion {
  titulo: string;
  descripcion: string;
}

export type LocaleCode = "es" | "en" | "de" | "fr";

/**
 * Diccionario curado de eventos en Minca por clave identificadora.
 */
const TRADUCCIONES_EVENTOS: Record<string, Partial<Record<"en" | "de" | "fr", EventoTraduccion>>> = {
  // 🦜 1. Jam Birding Minca
  "jam-birding": {
    en: {
      titulo: "Morning Birdwatching Tour (6:00 AM) — Jam Birding",
      descripcion: `Birdwatching excursion in Minca with certified birding guide Jam. Departures almost daily at 6:00 AM from the Minca bridge heading to the Torre del Sol observation platform (via San Rafael).

• Duration: 3.5 hours of guided ecological walk.
• Species: Troupials, Doves, Seedeaters, Toucans, and a great variety of Sierra Nevada hummingbirds.
• Includes: Certified local guide and professional binoculars provided.
• Meeting point: Minca Bridge (6:00 AM).
• Price: $75,000 COP per person.`,
    },
    de: {
      titulo: "Morgendliche Vogelbeobachtungstour (6:00 Uhr) — Jam Birding",
      descripcion: `Vogelbeobachtungstour in Minca mit dem spezialisierten Guide Jam. Fast tägliche Touren um 6:00 Uhr morgens ab der Brücke von Minca zur Aussichtsplattform Torre del Sol (über San Rafael).

• Dauer: 3,5 Stunden geführte Naturwanderung.
• Vogelarten: Trupiale, Tauben, Pfäffchen, Tukane und vielfältige Kolibris der Sierra Nevada.
• Inklusive: Fachkundige lokale Führung und Ferngläser inklusive.
• Treffpunkt: Brücke von Minca (6:00 Uhr).
• Preis: $75.000 COP pro Person.`,
    },
    fr: {
      titulo: "Visite Matinale d'Observation des Oiseaux (6h00) — Jam Birding",
      descripcion: `Excursion d'observation des oiseaux à Minca avec le guide naturaliste Jam. Départs presque tous les jours à 6h00 depuis le pont de Minca vers la plateforme d'observation Torre del Sol (via San Rafael).

• Durée : 3h30 de marche écologique guidée.
• Oiseaux observés : Troupiaux, Tourterelles, Toucans et grande variété de colibris de la Sierra Nevada.
• Inclus : Guide local expert et jumelles professionnelles fournies.
• Point de rendez-vous : Pont de Minca (6h00).
• Tarif : $75.000 COP par personne.`,
    },
  },

  // 🌿 2. Canúmake Minca (Nina & Samuel)
  canumake: {
    en: {
      titulo: "Dschungeltour Canúmake — Jungle & Cacao Forest Tour (🇨🇭🇩🇪🇨🇴)",
      descripcion: `Guided tour in German, Swiss German, and Spanish to natural water springs and sacred cacao forest in Minca. A magical, wild, and healing experience hosted by Nina and Samuel.

🌿 TOUR OPTIONS:
• Short Tour (approx. 3 hours): Includes natural snack, fresh lemonade, and organic coffee.
  - Adults: $99,000 COP | Children: $55,000 COP
  - Optional wood-fired organic vegetarian lunch (+ $33,000 COP, children free).

• Grand Tour (approx. 6 hours): Deep hike along ancient indigenous stone paths, energy spots, and natural springs. Includes snack, fresh lemonade, organic coffee, and regional bio-vegetarian lunch cooked over firewood.
  - Adults: $188,000 COP | Children: $88,000 COP

📍 GETTING THERE & BOOKING:
• Location: 40-minute scenic walk from Minca town across the river (100% natural, no vehicle access).
• ⚠️ ADVANCE BOOKING REQUIRED: Please book at least 1 day in advance (for 1-2 people) or 2 days (for groups or grand tour) to prepare fresh food over firewood.`,
    },
    de: {
      titulo: "Dschungeltour Canúmake — Urwald- & Kakaowald-Tour (🇨🇭🇩🇪🇨🇴)",
      descripcion: `Geführte Tour auf Schweizerdeutsch, Deutsch und Spanisch zu natürlichen Wasserquellen und Zauber-Kakaowald in Minca. Ein magisches, wildes und heilsames Erlebnis mit Nina und Samuel.

🌿 TOUR-OPTIONEN:
• Kurze Tour (ca. 3 Stunden): Inklusive Snack, frischer Limonade und Bio-Kaffee.
  - Erwachsene: $99.000 COP | Kinder: $55.000 COP
  - Optionales vegetarisches Bio-Mittagessen auf Holzfeuer (+ $33.000 COP, Kinder gratis).

• Große Tour (ca. 6 Stunden): Tiefere Wanderung über uralte indigene Steinwege, Kraftplätze und Quellbäche. Inklusive Snack, Limonade, Kaffee und regionalem bio-vegetarischem Mittagessen auf Holzfeuer.
  - Erwachsene: $188.000 COP | Kinder: $88.000 COP

📍 ANREISE & RESERVIERUNG:
• Lage: 40 Gehminuten vom Dorf Minca entfernt, über den Fluss (reine Natur, keine Fahrzeuge).
• ⚠️ VORANMELDUNG ERFORDERLICH: Bitte mindestens 1 Tag im Voraus (für 1-2 Personen) oder 2 Tage (für Gruppen / große Tour) reservieren, damit die frischen Speisen auf Holzfeuer vorbereitet werden können.`,
    },
    fr: {
      titulo: "Dschungeltour Canúmake — Visite Jungle & Forêt de Cacao (🇨🇭🇩🇪🇨🇴)",
      descripcion: `Visite guidée en allemand, suisse allemand et espagnol vers des sources d'eau naturelles et une forêt sacrée de cacao à Minca. Une expérience magique et ressourçante guidée par Nina et Samuel.

🌿 OPTIONS DE VISITE :
• Tour Court (environ 3 heures) : Comprend collation, citronnade fraîche et café bio.
  - Adultes : $99.000 COP | Enfants : $55.000 COP
  - Déjeuner végétarien bio cuit au feu de bois en option (+ $33.000 COP, gratuit pour les enfants).

• Grand Tour (environ 6 heures) : Randonnée le long des anciens chemins de pierre indigènes, lieux d'énergie et cascades. Comprend collation, citronnade, café et déjeuner bio-végétarien cuit au feu de bois.
  - Adultes : $188.000 COP | Enfants : $88.000 COP

📍 ACCÈS ET RÉSERVATION :
• Accès : Marche de 40 minutes depuis le village de Minca en traversant la rivière (sans véhicules).
• ⚠️ RÉSERVATION OBLIGATOIRE : Réserver au moins 1 jour à l'avance (1-2 personnes) ou 2 jours (groupes ou grand tour) pour préparer les produits frais au feu de bois.`,
    },
  },

  // 🍹 3. Casa Cora Minca
  "casa-cora": {
    en: {
      titulo: "Signature Cocktail Experience & Bartender School by the River",
      descripcion: `Enjoy author mixology, fresh river breezes, and world-class hospitality in Minca.

🍹 WORKSHOPS & CERTIFIED COURSES:
• Level 1: Introduction to Mixology — $333,000 COP (1 week, all-inclusive + certificate).
• Level 2: Advanced Techniques — $555,000 COP (2 weeks).
• Level 3: Working Flair Masterclass — $1,111,000 COP.

✨ Special Masterclasses:
• Craft Ginger Beer Brewing
• English for Professional Bartenders
• Flair & Shaker Techniques

Located right by the tranquil river in Minca. Direct booking with the mixology team.`,
    },
    de: {
      titulo: "Signature-Cocktails & Barkeeper-Schule am Fluss",
      descripcion: `Genieße erstklassige Autoren-Mixologie, frische Flussbrise und herzliche Gastfreundschaft in Minca.

🍹 WORKSHOPS & ZERTIFIZIERTE KURSE:
• Level 1: Einführung in die Mixologie — $333.000 COP (1 Woche, alles inklusive + Zertifikat).
• Level 2: Fortgeschrittene Techniken — $555.000 COP (2 Wochen).
• Level 3: Working Flair Masterclass — $1.111.000 COP.

✨ Spezial-Workshops:
• Hausgemachtes Ingwerbier brauen
• Englisch für Barkeeper
• Flair- & Shaker-Techniken

Direkt am Fluss von Minca gelegen. Reservierung direkt beim Team.`,
    },
    fr: {
      titulo: "Cocktails d'Auteur & École de Bartenders au Bord de la Rivière",
      descripcion: `Dégustez une mixologie de haute volée au bord de la rivière fraîche de Minca.

🍹 ATELIERS & FORMATIONS CERTIFIANTES :
• Niveau 1 : Introduction à la Mixologie — $333.000 COP (1 semaine, tout compris + certificat).
• Niveau 2 : Techniques Avancées — $555.000 COP (2 semaines).
• Niveau 3 : Masterclass Working Flair — $1.111.000 COP.

✨ Ateliers Spéciaux :
• Brassage artisanal de bière de gingembre
• Anglais pour bartenders
• Techniques de flair & shaker

Situé au bord de la rivière à Minca. Réservation directe avec les barmen.`,
    },
  },

  // 💃 4. El Bosque Minca (Salsa en Línea)
  salsa: {
    en: {
      titulo: "Linear Salsa Night & Social Dance at El Bosque",
      descripcion: `Tonight we dance in the jungle at El Bosque (formerly Casa Loma Minca)!

💃🕺 Come and enjoy an open Social Salsa evening:
• Linear Salsa (Salsa on 1 & On 2) workshop and social dance.
• Sunset mountain views, craft cocktails, good vibes, and social connection.
• Suitable for beginners and experienced dancers alike. Spread the word!`,
    },
    de: {
      titulo: "Line-Salsa-Abend & Social Dancing im El Bosque",
      descripcion: `Heute tanzen wir mitten im Dschungel bei El Bosque (ehemals Casa Loma Minca)!

💃🕺 Genieße einen offenen Salsa-Abend:
• Line-Salsa (On 1 & On 2) Einführung und freies Social Dancing.
• Sonnenuntergangsblick auf die Berge, Cocktails und tolle Atmosphäre.
• Offen für alle Niveaus — von Anfängern bis Fortgeschrittenen!`,
    },
    fr: {
      titulo: "Soirée Salsa en Ligne & Danse Sociale à El Bosque",
      descripcion: `Ce soir on danse dans la jungle à El Bosque (anciennement Casa Loma Minca) !

💃🕺 Rejoignez notre soirée Salsa Sociale :
• Salsa en ligne (On 1 & On 2) et danse libre sous les étoiles.
• Vue spectaculaire sur les montagnes au coucher du soleil, cocktails et ambiance chaleureuse.
• Accessible aux débutants comme aux danseurs confirmés !`,
    },
  },

  // 🍫 5. Finca La Frecuencia: Taller de Cacao & Baño de Sonido
  "cacao-soundbath": {
    en: {
      titulo: "Ancestral Cacao Workshop & Sacred Jungle Soundbath",
      descripcion: `Immerse yourself in ancestral medicine and conscious vibration at Finca La Frecuencia.

• Artisanal Cacao Ceremony: harvest, roast, and prepare pure Sierra Nevada cacao.
• Soundbath Therapy: Tibetan bowls, gongs, and overtone instruments in the natural forest.
• Organic vegan snack and natural mountain herbal infusion included.
• Bring comfortable clothes and a warm sweater for the evening chill.`,
    },
    de: {
      titulo: "Kakao-Zeremonie & Heilendes Klangbad im Dschungel",
      descripcion: `Tauche ein in uralte Pflanzenmedizin und heilsame Schwingungen auf der Finca La Frecuencia.

• Handwerkliche Kakao-Zeremonie: Ernten, Rösten und Zubereiten von reinem Sierra Nevada Kakao.
• Klangbad-Therapie: Tibetische Klangschalen, Gongs und Naturklänge mitten im Wald.
• Bio-veganer Snack und frischer Berg-Kräutertee inklusive.
• Bitte bequeme Kleidung und einen warmen Pullover für den Abend mitbringen.`,
    },
    fr: {
      titulo: "Atelier Cacao Ancestral & Bain Sonore dans la Jungle",
      descripcion: `Plongez dans la médecine ancestrale et les vibrations thérapeutiques à la Finca La Frecuencia.

• Cérémonie du Cacao artisanal : récolte, torréfaction et préparation du cacao pur de la Sierra Nevada.
• Bain Sonore Thérapeutique : bols tibétains, gongs et instruments harmoniques dans la forêt.
• Collation bio végétalienne et infusion aux herbes de montagne incluses.
• Prévoyez des vêtements confortables et un pull pour la fraîcheur du soir.`,
    },
  },

  // 💃 6. Finca La Frecuencia: Cacao Danza
  "cacao-danza": {
    en: {
      titulo: "Cacao Dance: Conscious Movement & Jungle Drums",
      descripcion: `A transformative celebration combining ceremonial cacao, organic live drums, and ecstatic conscious dance. Free your mind, ground your body, and connect with nature at Finca La Frecuencia.`,
    },
    de: {
      titulo: "Kakao-Tanz: Bewusste Bewegung & Dschungel-Trommeln",
      descripcion: `Ein transformierendes Erlebnis aus ritueller Kakao-Medizin, lebendigen Trommelrhythmen und freiem Conscious Dance. Befreie deinen Geist und verbinde dich mit der Natur auf der Finca La Frecuencia.`,
    },
    fr: {
      titulo: "Danse Cacao : Mouvement Conscient & Tambours de la Jungle",
      descripcion: `Une célébration transformatrice associant cacao cérémoniel, percussions en direct et danse libre extatique. Libérez votre esprit et reconnectez-vous avec la nature à la Finca La Frecuencia.`,
    },
  },

  // 🧘 7. Finca La Frecuencia: Acupuntura & Medicina China
  acupuntura: {
    en: {
      titulo: "Acupuncture, Traditional Chinese Medicine & Sound Therapy",
      descripcion: `Holistic restoration session guided by certified therapists in the tranquil mountains of Minca. Energy meridian harmonization, acupuncture, and therapeutic sound for deep rest.`,
    },
    de: {
      titulo: "Akupunktur, Traditionelle Chinesische Medizin & Klangtherapie",
      descripcion: `Ganzheitliche Regenerations-Sitzung in den ruhigen Bergen von Minca. Harmonisierung der Energiebahnen, sanfte Akupunktur und therapeutischer Klang für tiefenwirksame Erholung.`,
    },
    fr: {
      titulo: "Acupuncture, Médecine Traditionnelle Chinoise & Thérapie Sonore",
      descripcion: `Séance holistique de ressourcement guidée par des thérapeutes dans les montagnes de Minca. Équilibrage des méridiens, acupuncture et sons thérapeutiques pour un repos profond.`,
    },
  },

  // 🪷 8. Finca La Frecuencia: Cacao & Círculo Sensorial
  "cacao-sensorial": {
    en: {
      titulo: "Cacao & Sensory Circle: Presence, Touch & Connection",
      descripcion: `An intimate evening circle designed to awaken senses, slow down, and share meaningful connection with travelers and hosts in the heart of the forest.`,
    },
    de: {
      titulo: "Kakao & Sinneskreis: Achtsamkeit, Berührung & Verbindung",
      descripcion: `Ein intimer Abendkreis zur Sinneserweckung, Entschleunigung und achtsamen Begegnung mit Reisenden und Gastgebern mitten im Bergwald von Minca.`,
    },
    fr: {
      titulo: "Cacao & Cercle Sensoriel : Présence, Éveil des Sens & Partage",
      descripcion: `Un cercle intimiste en soirée pour éveiller les sens, ralentir et partager un moment de présence authentique au cœur de la forêt de Minca.`,
    },
  },

  // ⛰️ 9. Finca La Frecuencia: Caminata Sagrada
  caminata: {
    en: {
      titulo: "Sacred Walk & Mountain Connection Hike",
      descripcion: `Mindful walking exploration of hidden mountain trails, giant trees, and pristine creeks around Finca La Frecuencia. An authentic journey into the sacred spirit of the Sierra Nevada.`,
    },
    de: {
      titulo: "Heilige Dschungelwanderung & Bergverbindung",
      descripcion: `Achtsame Naturwanderung über verborgene Bergpfade, alte Baumriesen und unberührte Bäche rund um die Finca La Frecuencia. Eine authentische Reise zum Geist der Sierra Nevada.`,
    },
    fr: {
      titulo: "Marche Sacrée & Randonnée de Connexion avec la Montagne",
      descripcion: `Randonnée méditative sur des sentiers préservés, entre arbres géants et ruisseaux cristallins autour de la Finca La Frecuencia. Une immersion respectueuse dans la Sierra Nevada.`,
    },
  },
};

/**
 * Identifica la clave de traducción correspondiente a un evento.
 */
function identificarClaveEvento(evento: {
  id?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
}): string | null {
  const t = (evento.titulo || "").toLowerCase();
  const d = (evento.descripcion || "").toLowerCase();

  if (t.includes("birding") || t.includes("avistamiento de aves") || t.includes("jam")) {
    return "jam-birding";
  }
  if (t.includes("canúmake") || t.includes("canumake") || t.includes("dschungeltour") || d.includes("nina y samuel")) {
    return "canumake";
  }
  if (t.includes("casa cora") || t.includes("coctelería") || t.includes("bartender")) {
    return "casa-cora";
  }
  if (t.includes("salsa") || t.includes("el bosque") || t.includes("casa loma")) {
    return "salsa";
  }
  if (t.includes("cacao danza") || t.includes("tambores")) {
    return "cacao-danza";
  }
  if (t.includes("baño de sonido") || (t.includes("cacao") && t.includes("sonido"))) {
    return "cacao-soundbath";
  }
  if (t.includes("acupuntura") || t.includes("medicina china") || t.includes("medicina tradicional")) {
    return "acupuntura";
  }
  if (t.includes("sensorial") || t.includes("círculo sensorial")) {
    return "cacao-sensorial";
  }
  if (t.includes("caminata sagrada") || t.includes("conexión con la montaña")) {
    return "caminata";
  }

  return null;
}

/**
 * Función principal: Obtiene el evento traducido según el idioma activo.
 * - Si locale === "es", retorna el evento original sin tocarlo.
 * - Si locale es "en", "de" o "fr", aplica la traducción curada conservando
 *   la etiqueta técnica <!--recurrente:...-->.
 * - Si no existe traducción, hace fallback seguro al español.
 */
export function getEventoTraducido<T extends { titulo: string; descripcion?: string | null }>(
  evento: T,
  locale: string
): T {
  if (!evento) return evento;
  if (!locale || locale === "es") {
    return evento;
  }

  const clave = identificarClaveEvento(evento);
  if (!clave) {
    return evento;
  }

  const traducciones = TRADUCCIONES_EVENTOS[clave];
  if (!traducciones) {
    return evento;
  }

  const traduccion = traducciones[locale as "en" | "de" | "fr"];
  if (!traduccion) {
    return evento;
  }

  // Conservar cualquier etiqueta técnica de recurrencia que tuviera el evento original
  const recOriginal = extraerRecurrencia(evento.descripcion);
  let descripcionFinal = traduccion.descripcion.trim();

  if (recOriginal.esRecurrente && recOriginal.dias.length > 0) {
    descripcionFinal = `${descripcionFinal}\n\n<!--recurrente:${recOriginal.dias.join(",")}-->`;
  }

  return {
    ...evento,
    titulo: traduccion.titulo,
    descripcion: descripcionFinal,
  };
}
