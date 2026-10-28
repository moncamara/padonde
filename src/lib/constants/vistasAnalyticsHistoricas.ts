/**
 * Mapeo Oficial de Métricas de Visualizaciones Reales (Google Analytics 4 - GA4)
 * Extraído directamente del reporte de Páginas y Pantallas (30 Jul - 27 Oct 2026)
 * Propiedad: PaDónde (G-KNXJ1FEZE3)
 */

export interface MetricaHistoricaAliado {
  vistas: number;
  usuariosUnicos: number;
  idiomasDetectados: string[];
  destacado?: string;
}

// Mapa normalizado por palabras clave del nombre del aliado (case-insensitive)
export const METRICAS_HISTORICAS_GA4: Record<string, MetricaHistoricaAliado> = {
  // --- GASTRONOMÍA & RESTAURANTES ---
  "brisas del mar": {
    vistas: 151, // 143 (ES) + 4 (FR) + 3 (EN) + 1 (DE)
    usuariosUnicos: 89,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "pepe mojito": {
    vistas: 44,
    usuariosUnicos: 18,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "amora": {
    vistas: 49, // 37 (ES) + 7 (EN) + 4 (DE) + 1 (FR)
    usuariosUnicos: 24,
    idiomasDetectados: ["Español", "Inglés", "Alemán", "Francés"],
  },
  "silocibe": {
    vistas: 50, // 35 (Cora Fest) + 7 (Minca Cacao) + 4 (Karaoke) + 2 (Tattoo) + 1 (DE) + 1 (FR)
    usuariosUnicos: 28,
    idiomasDetectados: ["Español", "Alemán", "Francés"],
  },
  "casa cora": {
    vistas: 37, // 34 (ES) + 1 (EN) + 1 (DE) + 1 (FR)
    usuariosUnicos: 15,
    idiomasDetectados: ["Español", "Inglés", "Alemán", "Francés"],
  },
  "feeling bar": {
    vistas: 44, // 33 + 5 + 3 (EN) + 1 + 1 (DE) + 1 (FR)
    usuariosUnicos: 22,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "koko & chiqui": {
    vistas: 35,
    usuariosUnicos: 19,
    idiomasDetectados: ["Español"],
  },
  "pan artesanal koko": {
    vistas: 35,
    usuariosUnicos: 19,
    idiomasDetectados: ["Español"],
  },
  "casa aney": {
    vistas: 17,
    usuariosUnicos: 9,
    idiomasDetectados: ["Español"],
  },
  "rancho de puiro": {
    vistas: 14,
    usuariosUnicos: 6,
    idiomasDetectados: ["Español"],
  },
  "pizza nuevo sabor": {
    vistas: 12,
    usuariosUnicos: 7,
    idiomasDetectados: ["Español"],
  },
  "la miga": {
    vistas: 11, // 10 (ES) + 1 (DE)
    usuariosUnicos: 6,
    idiomasDetectados: ["Español", "Alemán"],
  },
  "duni": {
    vistas: 8,
    usuariosUnicos: 5,
    idiomasDetectados: ["Español"],
  },
  "mendihuaca beach restobar": {
    vistas: 7,
    usuariosUnicos: 6,
    idiomasDetectados: ["Español"],
  },
  "la casa del mono": {
    vistas: 6, // 4 (ES) + 1 (FR) + 1 (ES)
    usuariosUnicos: 5,
    idiomasDetectados: ["Español", "Francés"],
  },
  "don samuel": {
    vistas: 6, // 3 + 3
    usuariosUnicos: 4,
    idiomasDetectados: ["Español"],
  },
  "kakaw": {
    vistas: 3,
    usuariosUnicos: 3,
    idiomasDetectados: ["Español"],
  },
  "museo del cacao": {
    vistas: 3,
    usuariosUnicos: 3,
    idiomasDetectados: ["Español"],
  },
  "las mulatas": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },

  // --- HOSPEDAJES & HOSTALES ---
  "casa maya": {
    vistas: 86, // 49 (ES) + 23 (Pasadía) + 5 (Tertulia) + 4 (Fogata) + 2 (EN) + 1 (DE) + 1 (FR) + 1
    usuariosUnicos: 45,
    idiomasDetectados: ["Español", "Inglés", "Alemán", "Francés"],
  },
  "canumake": {
    vistas: 116, // 37 + 37 + 30 + 8 + 2 + 1 + 1
    usuariosUnicos: 58,
    idiomasDetectados: ["Español", "Alemán", "Inglés"],
  },
  "canúmake": {
    vistas: 116,
    usuariosUnicos: 58,
    idiomasDetectados: ["Español", "Alemán", "Inglés"],
  },
  "rancho de la luna": {
    vistas: 29,
    usuariosUnicos: 14,
    idiomasDetectados: ["Español"],
  },
  "setena": {
    vistas: 30, // 25 (ES) + 2 (FR) + 2 (DE) + 1 (EN)
    usuariosUnicos: 18,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "finca la frecuencia": {
    vistas: 24, // 8 (Cacao) + 7 (Acupuntura) + 6 (Sauna) + 2 (DE) + 1 (Bounce)
    usuariosUnicos: 17,
    idiomasDetectados: ["Español", "Alemán"],
  },
  "minkanta": {
    vistas: 27, // 16 (ES) + 5 (FR) + 3 (EN) + 3 (DE)
    usuariosUnicos: 14,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "puerto alto": {
    vistas: 15, // 14 (EN) + 1 (ES)
    usuariosUnicos: 8,
    idiomasDetectados: ["Inglés", "Español"],
  },
  "arena beach": {
    vistas: 17, // 9 + 8
    usuariosUnicos: 9,
    idiomasDetectados: ["Español"],
  },
  "velero relax": {
    vistas: 15, // 9 (ES) + 5 (ES) + 1 (EN)
    usuariosUnicos: 9,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "trekker glamping": {
    vistas: 11,
    usuariosUnicos: 7,
    idiomasDetectados: ["Español"],
  },
  "la veranda": {
    vistas: 9, // 8 (ES) + 1 (EN)
    usuariosUnicos: 6,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "el bosque": {
    vistas: 11, // 9 (ES) + 1 (DE) + 1 (FR)
    usuariosUnicos: 8,
    idiomasDetectados: ["Español", "Alemán", "Francés"],
  },
  "tribu hostal": {
    vistas: 7, // 6 (ES) + 1 (FR)
    usuariosUnicos: 5,
    idiomasDetectados: ["Español", "Francés"],
  },
  "entre río y fuego": {
    vistas: 4,
    usuariosUnicos: 4,
    idiomasDetectados: ["Español"],
  },
  "luma": {
    vistas: 6, // 4 + 2
    usuariosUnicos: 4,
    idiomasDetectados: ["Español"],
  },
  "mompe beach": {
    vistas: 8, // 6 + 2
    usuariosUnicos: 6,
    idiomasDetectados: ["Español"],
  },
  "astra mendihuaca": {
    vistas: 6,
    usuariosUnicos: 4,
    idiomasDetectados: ["Español"],
  },
  "dreams come true": {
    vistas: 6,
    usuariosUnicos: 4,
    idiomasDetectados: ["Español"],
  },
  "la ilusión": {
    vistas: 4,
    usuariosUnicos: 3,
    idiomasDetectados: ["Español"],
  },
  "bob marley": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "the sunset mendihuaca": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "el almendrón": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "la cumbre": {
    vistas: 1,
    usuariosUnicos: 1,
    idiomasDetectados: ["Español"],
  },

  // --- TOURS, BIENESTAR & CULTURA ---
  "jungle joe": {
    vistas: 86, // 67 (ES) + 6 (FR) + 6 (DE) + 6 (EN) + 1 (EN)
    usuariosUnicos: 35,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "jac de minca": {
    vistas: 62, // 52 (Video Minca) + 5 (EN) + 3 (FR) + 1 (DE) + 1 (Tambores)
    usuariosUnicos: 22,
    idiomasDetectados: ["Español", "Inglés", "Francés", "Alemán"],
  },
  "jam birding": {
    vistas: 24, // 20 (ES) + 2 (DE) + 2 (FR)
    usuariosUnicos: 13,
    idiomasDetectados: ["Español", "Alemán", "Francés"],
  },
  "río elemento": {
    vistas: 15, // 6 (Ancestral) + 4 (EN) + 3 (Acrotela) + 2 (Sábado)
    usuariosUnicos: 10,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "cacao cultural": {
    vistas: 5, // 4 (ES) + 1 (EN)
    usuariosUnicos: 4,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "bururake": {
    vistas: 5, // 3 (ES) + 2 (EN)
    usuariosUnicos: 4,
    idiomasDetectados: ["Español", "Inglés"],
  },
  "moana surf": {
    vistas: 3,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "río mendihuaca ecotours": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "aluna arte ancestral": {
    vistas: 2,
    usuariosUnicos: 2,
    idiomasDetectados: ["Español"],
  },
  "dhamma gutti": {
    vistas: 1,
    usuariosUnicos: 1,
    idiomasDetectados: ["Español"],
  },
};

/**
 * Busca las métricas de Google Analytics para un aliado según su nombre o título.
 * Si se pasa un mapa dinámico (cargado de la base de datos tras subir el CSV),
 * se prioriza sobre el catálogo histórico de respaldo.
 */
export function obtenerMetricasGA4Aliado(
  nombreAliado: string,
  mapaDinamico?: Record<string, MetricaHistoricaAliado> | null
): MetricaHistoricaAliado {
  const norm = (nombreAliado || "").toLowerCase().trim();

  // 1. Priorizar mapa dinámico subido por el administrador
  if (mapaDinamico && typeof mapaDinamico === "object") {
    for (const [clave, data] of Object.entries(mapaDinamico)) {
      if (norm.includes(clave) || clave.includes(norm)) {
        return data;
      }
    }
  }

  // 2. Fallback a catálogo histórico estático
  for (const [clave, data] of Object.entries(METRICAS_HISTORICAS_GA4)) {
    if (norm.includes(clave) || clave.includes(norm)) {
      return data;
    }
  }

  // 3. Piso estimado mínimo realista para aliados nuevos
  return {
    vistas: 4,
    usuariosUnicos: 3,
    idiomasDetectados: ["Español"],
  };
}
