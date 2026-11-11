export interface AliadosCopy {
  metaTitle: string;
  metaDescription: string;
  nav: {
    badge: string;
    exploreBoard: string;
    joinCta: string;
    joinCtaShort: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    waMessageHero: string;
    trustBadges: string[];
    destinationsLabel: string;
  };
  network: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nodes: {
      minca: {
        name: string;
        tag: string;
        desc: string;
        cta: string;
      };
      mendihuaca: {
        name: string;
        tag: string;
        desc: string;
        cta: string;
      };
      tayrona: {
        name: string;
        tag: string;
        desc: string;
        cta: string;
      };
    };
    flowNote: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ota: {
      badge: string;
      title: string;
      items: Array<{ title: string; desc: string }>;
    };
    padonde: {
      badge: string;
      title: string;
      items: Array<{ title: string; desc: string }>;
    };
  };
  pillars: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{
      badge: string;
      title: string;
      desc: string;
    }>;
  };
  plans: {
    eyebrow: string;
    title: string;
    subtitle: string;
    courtesyBanner: {
      badge: string;
      title: string;
      desc: string;
      cta: string;
    };
    cycleBadge: string;
    modalities: Array<{
      id: string;
      emoji: string;
      badge: string;
      title: string;
      subtitle: string;
      features: string[];
      cta: string;
      waMessage: string;
    }>;
  };
  faq: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{
      q: string;
      a: string;
    }>;
  };
  finalCta: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
}

export const ALIADOS_COPY: Record<string, AliadosCopy> = {
  es: {
    metaTitle: "PaDónde — Red Turística Oficial y Aliados B2B (Minca • Mendihuaca • Tayrona)",
    metaDescription:
      "El puente directo entre los viajeros y la magia de la Sierra Nevada y el Caribe. Vitrina digital en 4 idiomas, 0% comisiones por intermediación y reservas directas a tu WhatsApp.",
    nav: {
      badge: "Ecosistema Territorial & Aliados",
      exploreBoard: "Ver Cartelera",
      joinCta: "Sumar mi Negocio",
      joinCtaShort: "Aliados",
    },
    hero: {
      eyebrow: "🌿 SIERRA NEVADA DE SANTA MARTA & CARIBE COLOMBIANO",
      title: "El puente directo entre los viajeros y la magia de la Sierra Nevada y el Caribe",
      subtitle:
        "La vitrina digital que conecta la montaña y la playa (Minca ⇄ Mendihuaca ⇄ Tayrona) con información en vivo, traducción automática en 4 idiomas, 0% comisiones por intermediación y contacto directo vía WhatsApp.",
      primaryCta: "Sumar mi Negocio como Aliado",
      secondaryCta: "Explorar Cartelera de Planes",
      waMessageHero:
        "¡Hola equipo PaDónde! 🌿 Vi la página de Aliados y quiero activar mis 15 días de cortesía para sumar mi negocio a la cartelera.",
      trustBadges: [
        "🌍 4 Idiomas (ES • EN • FR • DE)",
        "💸 0% Comisión por Reserva",
        "📲 Contacto Directo a tu WhatsApp",
        "📡 PWA Ultra-Rápida con Modo Offline",
      ],
      destinationsLabel: "Explorar carteleras en vivo por destino:",
    },
    network: {
      eyebrow: "CIRCULACIÓN CIRCULAR DE VIAJEROS",
      title: "El Efecto Red Territorial: Por qué funciona nuestro ecosistema",
      subtitle:
        "Los viajeros no visitan un solo punto: recorren un circuito natural entre las cascadas de la Sierra y las olas del Caribe. PaDónde acompaña su ruta paso a paso, impulsando la ocupación local sin intermediarios.",
      nodes: {
        minca: {
          name: "Minca (Sierra Nevada)",
          tag: "Montaña • Café • Cascadas • Bienestar",
          desc: "Los turistas que descansan en el clima fresco de Minca consultan la cartelera diaria y descubren dónde bajar a la playa para continuar su viaje.",
          cta: "Ver cartelera de Minca →",
        },
        mendihuaca: {
          name: "Mendihuaca (Costa Caribe)",
          tag: "Playas Vírgenes • Río • Surf • Gastronomía",
          desc: "Quienes disfrutan del mar, el surf y la desembocadura del río descubren planes gastronómicos, fiestas frente al mar y su próximo ascenso a la montaña.",
          cta: "Ver cartelera de Mendihuaca →",
        },
        tayrona: {
          name: "Parque Tayrona & Veredas",
          tag: "Selva Tropical • Eco-Lodges • Senderos",
          desc: "Viajeros que exploran el Parque Nacional conectan con alojamientos auténticos, guías locales, restaurantes y transporte verificado en el corredor.",
          cta: "Ver cartelera de Tayrona →",
        },
      },
      flowNote:
        "🔄 Retroalimentación continua: Cada código QR escaneado en un hostal de Minca impulsa reservas en Mendihuaca y Tayrona, y cada viajero en la costa descubre dónde subir a descansar en la Sierra.",
    },
    comparison: {
      eyebrow: "TRANSPARENCIA COMERCIAL",
      title: "El Dolor del Aliado vs. La Solución PaDónde",
      subtitle:
        "Diseñamos un modelo justo para la economía local de la Sierra y el Caribe, eliminando las comisiones abusivas que reducen el margen de los anfitriones.",
      ota: {
        badge: "Modelo Extractivo",
        title: "Plataformas Tradicionales (OTAs)",
        items: [
          {
            title: "18% a 25% de comisión por cada venta",
            desc: "Pierdes hasta una cuarta parte de tu esfuerzo en cada habitación, tour o experiencia reservada.",
          },
          {
            title: "Retención y demora en tus pagos",
            desc: "Tu dinero queda retenido durante semanas o meses con descuentos bancarios y tasas ocultas.",
          },
          {
            title: "Intermediación impersonal y rígida",
            desc: "Bloquean tu número de teléfono para impedir que el viajero hable directamente contigo antes de pagar.",
          },
          {
            title: "Dependencia de algoritmos externos",
            desc: "Compites en listados masivos donde solo aparecen arriba quienes pagan sobrecostos publicitarios.",
          },
        ],
      },
      padonde: {
        badge: "Modelo Aliado Local 🌿",
        title: "Ecosistema PaDónde",
        items: [
          {
            title: "0% de comisiones por intermediación",
            desc: "Suscripción fija trimestral accesible. Si recibes 10 o 200 reservas, el 100% del ingreso es íntegramente tuyo.",
          },
          {
            title: "El dinero entra directo a tu cuenta",
            desc: "Cobras sin intermediarios por Nequi, Daviplata, Bancolombia, link propio o efectivo en tu recepción.",
          },
          {
            title: "Trato humano anfitrión–viajero por WhatsApp",
            desc: "El turista te escribe en 1 clic con un mensaje claro para confirmar disponibilidad, menú o cómo llegar.",
          },
          {
            title: "Traducción automática en 4 idiomas",
            desc: "Tu negocio, menú y eventos se leen perfectamente en Español, Inglés, Francés y Alemán sin esfuerzo extra.",
          },
        ],
      },
    },
    pillars: {
      eyebrow: "TECNOLOGÍA + TERRITORIO",
      title: "Pilares de Respaldo & Presencia Real",
      subtitle:
        "Combinamos ingeniería web de alto rendimiento con presencia física real en los puntos donde los turistas toman decisiones todos los días.",
      items: [
        {
          badge: "WPO & PWA Offline",
          title: "Vitrina móvil ultra-rápida (funciona sin señal)",
          desc: "Optimizada para redes 3G/4G de montaña y playa. Guarda los planes en la memoria del teléfono (PWA) para que el turista consulte tu negocio incluso en senderos sin cobertura.",
        },
        {
          badge: "Presencia en Calle",
          title: "Red física de códigos QR en el territorio",
          desc: "Difusión permanente mediante habladores y códigos QR en recepciones de hostales aliados, comercios, restaurantes y puntos de transporte regional.",
        },
        {
          badge: "Confianza Verificada",
          title: "Fichas georreferenciadas + Estrellas de Google Maps",
          desc: "Integramos tu calificación real y número de reseñas de Google Maps junto con enlaces directos a cómo llegar y a tu WhatsApp verificado.",
        },
      ],
    },
    plans: {
      eyebrow: "INVERSIÓN CLARA Y ACCESIBLE",
      title: "Planes Transparentes y Cortesía de Entrada",
      subtitle:
        "Primero ves los resultados en tu propio teléfono. Sin contratos forzosos, sin letra pequeña y con acompañamiento editorial incluido.",
      courtesyBanner: {
        badge: "🎁 CORTESÍA DE BIENVENIDA",
        title: "15 Días de Cortesía Sin Costo para Validar el Servicio",
        desc: "Creamos, diseñamos y traducimos tu ficha profesional a 4 idiomas sin costo inicial. Durante 15 días mides las visualizaciones reales de turistas y los mensajes que llegan a tu WhatsApp antes de decidir.",
        cta: "Solicitar mis 15 días de cortesía →",
      },
      cycleBadge: "Modalidades Trimestrales • 0% Comisión",
      modalities: [
        {
          id: "hospedajes",
          emoji: "🏡",
          badge: "Alojamiento & Estadías",
          title: "Hospedajes, Eco-Lodges & Hostales",
          subtitle: "Reservas directas sin el 20% de comisión de las OTAs.",
          features: [
            "Calculadora interactiva de estadía por tipo de habitación y número de noches",
            "Galería fotográfica optimizada en alta definición (WebP) y video/reel",
            "Insignia con tu calificación oficial y reseñas reales de Google Maps",
            "Botón de reserva directa a tu WhatsApp en 4 idiomas (ES, EN, FR, DE)",
          ],
          cta: "Vincular mi Hospedaje",
          waMessage:
            "¡Hola PaDónde! 🏡 Tengo un hospedaje y me gustaría activar los 15 días de cortesía en la cartelera.",
        },
        {
          id: "gastronomia",
          emoji: "🍽️",
          badge: "Cartelera Viva & Experiencias",
          title: "Gastronomía, Tours, Bienestar & Eventos",
          subtitle: "Ideal para restaurantes, cafés, bares, agencias de tours y centros de bienestar.",
          features: [
            "Publicación de eventos diarios, recurrentes o experiencias permanentes en cartelera",
            "Menú digital interactivo multilingüe con platos, precios y fotos",
            "Prioridad en filtros por fecha ('Hoy', 'Mañana', 'Fin de semana') y categoría",
            "Actualización ágil de tus eventos o menús enviándonos un mensaje por WhatsApp",
          ],
          cta: "Sumar mi Restaurante / Tour",
          waMessage:
            "¡Hola PaDónde! 🍽️🌿 Tengo un restaurante / tour / experiencia y quiero activar mis 15 días de cortesía.",
        },
        {
          id: "esenciales",
          emoji: "🛵",
          badge: "Info Útil & Directorio Local",
          title: "Servicios Esenciales & Comercio Local",
          subtitle: "Visibilidad continua para los servicios clave que todo viajero necesita.",
          features: [
            "Presencia destacada en la pestaña 'Info Útil & Servicios' de tu destino",
            "Categorías: Transporte/Motos, Cajeros & Divisas, Farmacia/Salud y Tiendas",
            "Horarios de atención, ubicación exacta en Google Maps y contacto en 1 clic",
            "Tarifa solidaria trimestral pensada para comercios y trabajadores locales",
          ],
          cta: "Registrar mi Servicio Local",
          waMessage:
            "¡Hola PaDónde! 🛵 Tengo un servicio local / comercio y quiero información para aparecer en Info Útil & Servicios.",
        },
      ],
    },
    faq: {
      eyebrow: "RESPUESTAS CLARAS",
      title: "Preguntas Frecuentes de Nuestros Aliados",
      subtitle: "Todo lo que necesitas saber antes de sumar tu negocio a PaDónde.",
      items: [
        {
          q: "¿Cómo recibo el dinero de mis reservas o ventas?",
          a: "El 100% del dinero va directo del viajero a tus manos. Cuando un turista hace clic en tu publicación, se abre una conversación directa en tu WhatsApp comercial. Tú acuerdas y recibes el pago en tu cuenta (Nequi, Daviplata, Bancolombia, link de pago o efectivo) sin que PaDónde toque ni retenga un solo peso.",
        },
        {
          q: "¿Qué pasa tras los 15 días de cortesía?",
          a: "Al finalizar tus 15 días de bienvenida, te compartimos por WhatsApp un reporte transparente con las visualizaciones reales de tu ficha (Google Analytics) y los clics hacia tu WhatsApp. Si estás satisfecho con el impacto, eliges tu modalidad trimestral para mantener tu vitrina activa; si decides no continuar, simplemente se pausa sin cobros automáticos ni compromisos.",
        },
        {
          q: "¿Cómo actualizo mis fotos, eventos de la semana o precios del menú?",
          a: "No tienes que lidiar con paneles complicados. Solo nos envías un mensaje, foto o audio por WhatsApp con el evento de la semana, nuevas fotografías o ajustes en tu menú/tarifario, y nuestro equipo lo actualiza y traduce a los 4 idiomas por ti.",
        },
        {
          q: "¿Realmente mis publicaciones se ven en 4 idiomas?",
          a: "Sí. Toda ficha, descripción, evento y menú interactivo cuenta con soporte en Español, Inglés, Francés y Alemán. Así los viajeros internacionales comprenden tu propuesta al instante y se animan a reservar contigo sin barreras.",
        },
      ],
    },
    finalCta: {
      title: "¿Listo para conectar tu negocio con los viajeros que hoy recorren nuestro territorio?",
      subtitle:
        "Escríbenos por WhatsApp, activa tus 15 días de cortesía sin costo y estrena tu vitrina multilingüe hoy mismo.",
      primaryCta: "Hablar por WhatsApp y Activar Cortesía",
      secondaryCta: "Explorar Cartelera de Minca",
    },
  },
  en: {
    metaTitle: "PaDónde — Official Tourist Network & Local Partners (Minca • Mendihuaca • Tayrona)",
    metaDescription:
      "The direct bridge between travelers and the magic of the Sierra Nevada and the Caribbean. Live tourist board in 4 languages, 0% booking commissions, and direct WhatsApp contact.",
    nav: {
      badge: "Regional Network & Partners",
      exploreBoard: "Explore Live Board",
      joinCta: "Join as Partner",
      joinCtaShort: "Partners",
    },
    hero: {
      eyebrow: "🌿 SIERRA NEVADA DE SANTA MARTA & COLOMBIAN CARIBBEAN",
      title: "The direct bridge between travelers and the magic of the Sierra Nevada and the Caribbean",
      subtitle:
        "The digital showcase connecting mountain and beach (Minca ⇄ Mendihuaca ⇄ Tayrona) with live daily info, automatic translation in 4 languages, 0% booking commissions, and direct WhatsApp contact.",
      primaryCta: "Join as a Business Partner",
      secondaryCta: "Explore Live Events Board",
      waMessageHero:
        "Hi PaDónde team! 🌿 I visited the Partners page and would like to activate my 15-day free courtesy trial for my business.",
      trustBadges: [
        "🌍 4 Languages (ES • EN • FR • DE)",
        "💸 0% Booking Commission",
        "📲 Direct to Your WhatsApp",
        "📡 Ultra-Fast Offline-Ready PWA",
      ],
      destinationsLabel: "Explore live boards by destination:",
    },
    network: {
      eyebrow: "CIRCULAR TRAVELER FLOW",
      title: "The Territorial Network Effect: Why our ecosystem works",
      subtitle:
        "Travelers don't stay in just one spot—they follow a natural route between the waterfalls of the Sierra and the waves of the Caribbean. PaDónde guides their journey step by step, boosting local occupancy without middlemen.",
      nodes: {
        minca: {
          name: "Minca (Sierra Nevada)",
          tag: "Mountain • Coffee • Waterfalls • Wellness",
          desc: "Travelers resting in Minca's fresh mountain air check the daily board and discover where to head down to the Caribbean coast next.",
          cta: "Explore Minca board →",
        },
        mendihuaca: {
          name: "Mendihuaca (Caribbean Coast)",
          tag: "Pristine Beaches • River • Surf • Dining",
          desc: "Visitors enjoying the surf and river mouth discover local dining, beach gatherings, and plan their trip up into the Sierra Nevada.",
          cta: "Explore Mendihuaca board →",
        },
        tayrona: {
          name: "Tayrona Park & Foothills",
          tag: "Rainforest • Eco-Lodges • Trails",
          desc: "Explorers visiting Tayrona National Park connect directly with authentic eco-lodges, certified guides, restaurants, and local transport.",
          cta: "Explore Tayrona board →",
        },
      },
      flowNote:
        "🔄 Continuous cross-pollination: Every QR scan at a hostel in Minca drives bookings in Mendihuaca and Tayrona, and every traveler on the coast discovers where to stay in the mountains.",
    },
    comparison: {
      eyebrow: "FAIR LOCAL COMMERCE",
      title: "Traditional Platforms vs. The PaDónde Solution",
      subtitle:
        "Built to strengthen the local economy of the Sierra Nevada and the Caribbean by removing high middleman commissions.",
      ota: {
        badge: "Extractive Model",
        title: "Traditional OTAs",
        items: [
          {
            title: "18% to 25% commission per booking",
            desc: "You lose nearly a quarter of your revenue on every room, tour, or experience sold.",
          },
          {
            title: "Delayed payouts & bank holds",
            desc: "Your earnings are held for weeks with hidden processing and currency fees.",
          },
          {
            title: "Impersonal middleman wall",
            desc: "Phone numbers are blocked so guests cannot ask you questions directly before paying.",
          },
          {
            title: "Opaque ranking algorithms",
            desc: "Local hosts get buried unless they pay extra commission boosts.",
          },
        ],
      },
      padonde: {
        badge: "Local Partner Model 🌿",
        title: "PaDónde Ecosystem",
        items: [
          {
            title: "0% commission on bookings",
            desc: "Accessible fixed quarterly membership. Whether you get 10 or 200 bookings, 100% of the revenue is yours.",
          },
          {
            title: "Money goes straight to your account",
            desc: "Get paid directly via Nequi, Bancolombia, Daviplata, payment link, or cash at reception.",
          },
          {
            title: "Human host–traveler chat on WhatsApp",
            desc: "Travelers message you in 1 tap with a clear pre-filled note to confirm availability, menus, or directions.",
          },
          {
            title: "Automatic translation in 4 languages",
            desc: "Your profile, interactive menu, and events are readable in Spanish, English, French, and German.",
          },
        ],
      },
    },
    pillars: {
      eyebrow: "TECHNOLOGY + TERRITORY",
      title: "Real On-the-Ground Presence & Tech Pillars",
      subtitle:
        "We combine ultra-fast mobile web engineering with physical QR distribution where travelers make daily decisions.",
      items: [
        {
          badge: "WPO & Offline PWA",
          title: "Ultra-fast mobile showcase (works offline)",
          desc: "Engineered for mountain and beach 3G/4G networks. Caches plans on the traveler's phone so they can view your business even without signal.",
        },
        {
          badge: "On-the-Ground Network",
          title: "Physical QR network across the region",
          desc: "Displayed on reception stands in partner hostels, cafés, restaurants, and local transport hubs.",
        },
        {
          badge: "Verified Trust",
          title: "Geo-referenced profiles + Google Maps stars",
          desc: "Showcases your real Google Maps rating and review count alongside direct directions and verified WhatsApp contact.",
        },
      ],
    },
    plans: {
      eyebrow: "TRANSPARENT MEMBERSHIP",
      title: "Clear Plans & 15-Day Courtesy Welcome",
      subtitle:
        "Experience real results on your phone first—no lock-in contracts and full editorial support included.",
      courtesyBanner: {
        badge: "🎁 WELCOME COURTESY",
        title: "15-Day Free Courtesy Trial to Validate the Service",
        desc: "We build and translate your showcase into 4 languages at zero upfront cost. Track real tourist views and incoming WhatsApp inquiries for 15 days before making any decision.",
        cta: "Claim my 15-day courtesy trial →",
      },
      cycleBadge: "Quarterly Modalities • 0% Commission",
      modalities: [
        {
          id: "hospedajes",
          emoji: "🏡",
          badge: "Stays & Hospitality",
          title: "Hotels, Eco-Lodges & Hostels",
          subtitle: "Direct bookings without the 20% OTA commission.",
          features: [
            "Interactive stay calculator by room type and number of nights",
            "High-definition WebP photo gallery and video reel support",
            "Official Google Maps star rating and verified reviews badge",
            "Direct WhatsApp booking button in 4 languages (ES, EN, FR, DE)",
          ],
          cta: "List My Accommodation",
          waMessage:
            "Hi PaDónde! 🏡 I run an accommodation and would like to activate the 15-day courtesy trial.",
        },
        {
          id: "gastronomia",
          emoji: "🍽️",
          badge: "Live Board & Experiences",
          title: "Dining, Tours, Wellness & Events",
          subtitle: "Built for restaurants, cafés, bars, tour operators, and wellness spaces.",
          features: [
            "Daily, recurring, or permanent experiences on the live destination board",
            "Interactive multilingual digital menu with dishes, prices, and photos",
            "Priority visibility in 'Today', 'Tomorrow', and 'Weekend' filters",
            "Easy updates—just send us a WhatsApp message with new events or menu items",
          ],
          cta: "List My Restaurant / Tour",
          waMessage:
            "Hi PaDónde! 🍽️🌿 I run a restaurant / tour / experience and want to activate my 15-day courtesy trial.",
        },
        {
          id: "esenciales",
          emoji: "🛵",
          badge: "Useful Info & Local Directory",
          title: "Essential Services & Local Commerce",
          subtitle: "Permanent visibility for the key services every traveler needs.",
          features: [
            "Featured in the 'Useful Info & Services' tab of your destination",
            "Categories: Moto/Transport, ATMs & Currency, Pharmacy/Health, and Local Shops",
            "Opening hours, exact Google Maps pin, and 1-tap WhatsApp contact",
            "Accessible community-friendly quarterly rate for local providers",
          ],
          cta: "Register My Local Service",
          waMessage:
            "Hi PaDónde! 🛵 I offer a local essential service and want info on joining Useful Info & Services.",
        },
      ],
    },
    faq: {
      eyebrow: "CLEAR ANSWERS",
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about partnering with PaDónde.",
      items: [
        {
          q: "How do I receive money from my bookings?",
          a: "100% of the payment goes directly from the traveler to you. When a visitor taps your listing, it opens a direct chat on your WhatsApp. You coordinate and receive payment directly into your account (Nequi, Bancolombia, payment link, or cash)—PaDónde never holds or touches your money.",
        },
        {
          q: "What happens after the 15-day courtesy period?",
          a: "At the end of your 15 days, we send you an impact report showing your real tourist page views and WhatsApp clicks. If you're happy with the results, you activate your quarterly plan; if not, your listing is simply paused with zero automatic charges.",
        },
        {
          q: "How do I update my photos, weekly events, or menu?",
          a: "No complex dashboards required. Simply send us a message, photo, or voice note on WhatsApp with your new event, updated prices, or photos, and our team updates and translates your listing for you.",
        },
        {
          q: "Are my listings really translated into 4 languages?",
          a: "Yes. Every listing, description, event, and interactive menu is automatically available in Spanish, English, French, and German so international travelers can book with confidence.",
        },
      ],
    },
    finalCta: {
      title: "Ready to connect your business with travelers exploring our region today?",
      subtitle:
        "Message us on WhatsApp, activate your 15-day free courtesy trial, and launch your multilingual showcase.",
      primaryCta: "Chat on WhatsApp & Start Free Trial",
      secondaryCta: "Explore Minca Live Board",
    },
  },
  fr: {
    metaTitle: "PaDónde — Réseau Touristique Officiel & Partenaires (Minca • Mendihuaca • Tayrona)",
    metaDescription:
      "Le pont direct entre les voyageurs et la magie de la Sierra Nevada et des Caraïbes. Vitrine numérique en 4 langues, 0% de commission et contact direct via WhatsApp.",
    nav: {
      badge: "Réseau Territorial & Partenaires",
      exploreBoard: "Voir l'Agenda",
      joinCta: "Devenir Partenaire",
      joinCtaShort: "Partenaires",
    },
    hero: {
      eyebrow: "🌿 SIERRA NEVADA DE SANTA MARTA & CARAÏBES COLOMBIENNES",
      title: "Le pont direct entre les voyageurs et la magie de la Sierra Nevada et des Caraïbes",
      subtitle:
        "La vitrine numérique qui relie la montagne et la plage (Minca ⇄ Mendihuaca ⇄ Tayrona) avec des informations en direct, une traduction automatique en 4 langues, 0% de commission et un contact direct sur WhatsApp.",
      primaryCta: "Ajouter mon Commerce comme Partenaire",
      secondaryCta: "Explorer l'Agenda des Sorties",
      waMessageHero:
        "Bonjour l'équipe PaDónde ! 🌿 J'ai vu la page Partenaires et je souhaite activer mes 15 jours d'essai gratuit pour mon établissement.",
      trustBadges: [
        "🌍 4 Langues (ES • EN • FR • DE)",
        "💸 0% de Commission",
        "📲 Contact Direct WhatsApp",
        "📡 Application PWA Hors-Ligne",
      ],
      destinationsLabel: "Explorer les agendas en direct par destination :",
    },
    network: {
      eyebrow: "CIRCULATION DES VOYAGEURS",
      title: "L'Effet Réseau Territorial : Pourquoi notre écosystème fonctionne",
      subtitle:
        "Les voyageurs parcourent un circuit naturel entre la fraîcheur de Minca et les plages de Mendihuaca et Tayrona. PaDónde accompagne leur itinéraire et stimule l'occupation locale.",
      nodes: {
        minca: {
          name: "Minca (Sierra Nevada)",
          tag: "Montagne • Café • Cascades • Bien-être",
          desc: "Les touristes séjournant à Minca consultent l'agenda du jour et planifient leur descente vers les plages des Caraïbes.",
          cta: "Voir l'agenda de Minca →",
        },
        mendihuaca: {
          name: "Mendihuaca (Côte Caraïbe)",
          tag: "Plages Sauvages • Rivière • Surf • Gastronomie",
          desc: "Les voyageurs sur la côte découvrent les restaurants, les soirées en bord de mer et leur prochaine étape en montagne.",
          cta: "Voir l'agenda de Mendihuaca →",
        },
        tayrona: {
          name: "Parc Tayrona & Environs",
          tag: "Jungle Tropicale • Éco-Lodges • Sentiers",
          desc: "Les visiteurs du Parc Tayrona trouvent directement des éco-lodges vérifiés, des guides locaux et des transports sûrs.",
          cta: "Voir l'agenda de Tayrona →",
        },
      },
      flowNote:
        "🔄 Synergie régionale : Chaque code QR scanné à Minca génère des visites vers Mendihuaca et Tayrona, et inversement.",
    },
    comparison: {
      eyebrow: "TRANSPARENCE COMMERCIALE",
      title: "Plateformes Traditionnelles vs. La Solution PaDónde",
      subtitle:
        "Un modèle équitable pensé pour l'économie locale de la Sierra Nevada et des Caraïbes.",
      ota: {
        badge: "Modèle Classique",
        title: "Plateformes Traditionnelles (OTAs)",
        items: [
          {
            title: "18% à 25% de commission par réservation",
            desc: "Vous perdez jusqu'à un quart de votre chiffre d'affaires sur chaque vente.",
          },
          {
            title: "Rétention et délais de paiement",
            desc: "Vos revenus sont bloqués pendant des semaines avec des frais bancaires.",
          },
          {
            title: "Intermédiation impersonnelle",
            desc: "Aucun contact direct avec le voyageur avant la transaction.",
          },
          {
            title: "Algorithmes opaques",
            desc: "Visibilité réduite sans payer de publicités supplémentaires.",
          },
        ],
      },
      padonde: {
        badge: "Modèle Partenaire Local 🌿",
        title: "Écosystème PaDónde",
        items: [
          {
            title: "0% de commission sur vos ventes",
            desc: "Abonnement trimestriel fixe et accessible. 100% du montant des réservations vous revient.",
          },
          {
            title: "Paiement direct sur votre compte",
            desc: "Vous encaissez directement via Nequi, Bancolombia, lien de paiement ou espèces.",
          },
          {
            title: "Contact humain hôte–voyageur sur WhatsApp",
            desc: "Le touriste vous écrit en 1 clic pour réserver une table, une chambre ou un tour.",
          },
          {
            title: "Traduction automatique en 4 langues",
            desc: "Votre fiche, menu et événements sont disponibles en espagnol, anglais, français et allemand.",
          },
        ],
      },
    },
    pillars: {
      eyebrow: "TECHNOLOGIE & TERRAIN",
      title: "Nos Piliers de Confiance & Présence Locale",
      subtitle:
        "Une vitrine mobile ultra-rapide alliée à un réseau physique de codes QR sur le terrain.",
      items: [
        {
          badge: "PWA & Mode Hors-Ligne",
          title: "Vitrine mobile ultra-rapide (même sans réseau)",
          desc: "Conçue pour les zones de montagne et de plage à faible couverture grâce à la mise en cache PWA.",
        },
        {
          badge: "Présence Terrain",
          title: "Réseau physique de codes QR dans la région",
          desc: "Diffusion dans les réceptions d'hôtels partenaires, commerces et points de transport.",
        },
        {
          badge: "Confiance Vérifiée",
          title: "Fiches géolocalisées & Avis Google Maps",
          desc: "Affichage de votre note et de vos avis Google Maps avec itinéraire et WhatsApp vérifié.",
        },
      ],
    },
    plans: {
      eyebrow: "OFFRES TRANSPARENTES",
      title: "Formules Claires & 15 Jours d'Essai Offerts",
      subtitle:
        "Testez concrètement le service pendant 15 jours sans frais ni engagement.",
      courtesyBanner: {
        badge: "🎁 BIENVENUE OFFERTE",
        title: "15 Jours d'Essai Sans Frais pour Valider le Service",
        desc: "Nous créons et traduisons votre vitrine en 4 langues gratuitement. Mesurez les vues et les messages WhatsApp reçus pendant 15 jours avant de décider.",
        cta: "Activer mes 15 jours offerts →",
      },
      cycleBadge: "Formules Trimestrielles • 0% Commission",
      modalities: [
        {
          id: "hospedajes",
          emoji: "🏡",
          badge: "Hébergements",
          title: "Hôtels, Éco-Lodges & Auberges",
          subtitle: "Réservations directes sans commission.",
          features: [
            "Calculateur de séjour interactif par chambre et nombre de nuits",
            "Galerie photo haute définition (WebP) et vidéo",
            "Note officielle et avis Google Maps intégrés",
            "Bouton de réservation directe WhatsApp en 4 langues",
          ],
          cta: "Inscrire mon Hébergement",
          waMessage:
            "Bonjour PaDónde ! 🏡 J'ai un hébergement et je souhaite activer les 15 jours d'essai gratuit.",
        },
        {
          id: "gastronomia",
          emoji: "🍽️",
          badge: "Agenda & Expériences",
          title: "Restaurants, Tours, Bien-être & Événements",
          subtitle: "Pour restaurants, cafés, bars, agences d'excursions et centres de yoga.",
          features: [
            "Publication d'événements quotidiens, récurrents ou permanents",
            "Menu numérique interactif traduit en 4 langues",
            "Mise en avant dans les filtres 'Aujourd'hui', 'Demain' et 'Week-end'",
            "Mises à jour rapides par simple message WhatsApp",
          ],
          cta: "Inscrire mon Restaurant / Tour",
          waMessage:
            "Bonjour PaDónde ! 🍽️🌿 J'ai un restaurant / tour et je souhaite activer mes 15 jours d'essai.",
        },
        {
          id: "esenciales",
          emoji: "🛵",
          badge: "Infos Utiles",
          title: "Services Essentiels & Commerce Local",
          subtitle: "Visibilité permanente pour les services indispensables aux voyageurs.",
          features: [
            "Présence dans l'onglet 'Infos Utiles & Services' de votre destination",
            "Transports, change/distributeurs, santé et commerces locaux",
            "Horaires, localisation Google Maps et contact WhatsApp en 1 clic",
            "Tarif trimestriel solidaire adapté aux acteurs locaux",
          ],
          cta: "Inscrire mon Service Local",
          waMessage:
            "Bonjour PaDónde ! 🛵 Je propose un service local et je souhaite apparaître dans Infos Utiles.",
        },
      ],
    },
    faq: {
      eyebrow: "QUESTIONS FRÉQUENTES",
      title: "Tout savoir sur le partenariat PaDónde",
      subtitle: "Des réponses claires et sans détour.",
      items: [
        {
          q: "Comment je reçois l'argent de mes réservations ?",
          a: "100% du paiement arrive directement sur votre compte (Nequi, Bancolombia, lien de paiement ou espèces). Le client vous contacte directement sur votre WhatsApp sans intermédiaire.",
        },
        {
          q: "Que se passe-t-il après les 15 jours gratuits ?",
          a: "Nous vous envoyons un bilan précis des vues et des clics WhatsApp générés. Si vous souhaitez continuer, vous activez votre formule trimestrielle ; sinon, la fiche est mise en pause sans frais.",
        },
        {
          q: "Comment mettre à jour mes photos, événements ou mon menu ?",
          a: "Envoyez-nous simplement un message ou une photo sur WhatsApp et notre équipe met à jour et traduit votre fiche en quelques minutes.",
        },
        {
          q: "Mes publications sont-elles vraiment traduites en 4 langues ?",
          a: "Oui, automatiquement en espagnol, anglais, français et allemand pour accueillir tous les voyageurs internationaux.",
        },
      ],
    },
    finalCta: {
      title: "Prêt à connecter votre établissement aux voyageurs de la région ?",
      subtitle: "Écrivez-nous sur WhatsApp et activez vos 15 jours d'essai gratuit dès aujourd'hui.",
      primaryCta: "Écrire sur WhatsApp & Essayer 15 Jours",
      secondaryCta: "Explorer l'Agenda de Minca",
    },
  },
  de: {
    metaTitle: "PaDónde — Offizielles Tourismusnetzwerk & Partner (Minca • Mendihuaca • Tayrona)",
    metaDescription:
      "Die direkte Brücke zwischen Reisenden und der Magie der Sierra Nevada und der Karibik. Digitale Plattform in 4 Sprachen, 0% Provision und direkter WhatsApp-Kontakt.",
    nav: {
      badge: "Regionales Netzwerk & Partner",
      exploreBoard: "Live-Kalender",
      joinCta: "Partner werden",
      joinCtaShort: "Partner",
    },
    hero: {
      eyebrow: "🌿 SIERRA NEVADA DE SANTA MARTA & KOLUMBIANISCHE KARIBIK",
      title: "Die direkte Brücke zwischen Reisenden und der Magie der Sierra Nevada und der Karibik",
      subtitle:
        "Das digitale Schaufenster zwischen Bergwelt und Strand (Minca ⇄ Mendihuaca ⇄ Tayrona) mit Live-Informationen, automatischer Übersetzung in 4 Sprachen, 0% Vermittlungsprovision und direktem WhatsApp-Kontakt.",
      primaryCta: "Mein Unternehmen als Partner eintragen",
      secondaryCta: "Live-Aktivitäten entdecken",
      waMessageHero:
        "Hallo PaDónde-Team! 🌿 Ich habe die Partnerseite gesehen und möchte meine 15 kostenlosen Testtage für mein Unternehmen aktivieren.",
      trustBadges: [
        "🌍 4 Sprachen (ES • EN • FR • DE)",
        "💸 0% Buchungsprovision",
        "📲 Direkt auf dein WhatsApp",
        "📡 Ultraschnelle Offline-PWA",
      ],
      destinationsLabel: "Live-Kalender nach Reiseziel entdecken:",
    },
    network: {
      eyebrow: "REGIONALER REISEKREISLAUF",
      title: "Der regionale Netzwerkeffekt: Warum unser Ökosystem funktioniert",
      subtitle:
        "Reisende verbinden die frische Bergwelt von Minca mit den Stränden von Mendihuaca und dem Tayrona-Nationalpark. PaDónde vernetzt diese Route nahtlos.",
      nodes: {
        minca: {
          name: "Minca (Sierra Nevada)",
          tag: "Berge • Kaffee • Wasserfälle • Wellness",
          desc: "Gäste in Minca entdecken Tagesaktivitäten und planen ihre Weiterreise an die Karibikküste.",
          cta: "Minca-Kalender ansehen →",
        },
        mendihuaca: {
          name: "Mendihuaca (Karibikküste)",
          tag: "Unberührte Strände • Fluss • Surfen • Gastronomie",
          desc: "Strandbesucher finden Restaurants, Events am Meer und ihren nächsten Aufenthalt in den Bergen.",
          cta: "Mendihuaca-Kalender ansehen →",
        },
        tayrona: {
          name: "Tayrona-Park & Umgebung",
          tag: "Regenwald • Eco-Lodges • Wanderwege",
          desc: "Besucher des Nationalparks vernetzen sich direkt mit Eco-Lodges, lokalen Guides und Transportanbietern.",
          cta: "Tayrona-Kalender ansehen →",
        },
      },
      flowNote:
        "🔄 Gegenseitige Stärkung: Jeder QR-Scan in Minca fördert Buchungen an der Küste und umgekehrt.",
    },
    comparison: {
      eyebrow: "FAIRE KONDITIONEN",
      title: "Klassische Plattformen vs. Die PaDónde-Lösung",
      subtitle:
        "Entwickelt zur Stärkung lokaler Gastgeber ohne hohe Vermittlungsgebühren.",
      ota: {
        badge: "Klassisches Modell",
        title: "Traditionelle OTAs",
        items: [
          {
            title: "18% bis 25% Provision pro Buchung",
            desc: "Bis zu ein Viertel deines Umsatzes geht an externe Plattformen verloren.",
          },
          {
            title: "Verzögerte Auszahlungen",
            desc: "Dein Geld wird wochenlang einbehalten – inklusive Bankgebühren.",
          },
          {
            title: "Unpersönliche Vermittlung",
            desc: "Kein direkter Kontakt zum Gast vor der Buchung möglich.",
          },
          {
            title: "Undurchsichtige Algorithmen",
            desc: "Sichtbarkeit kostet zusätzliche Werbegebühren.",
          },
        ],
      },
      padonde: {
        badge: "Lokales Partner-Modell 🌿",
        title: "PaDónde Ökosystem",
        items: [
          {
            title: "0% Provision auf deine Buchungen",
            desc: "Fairer Quartalsbeitrag. 100% jeder Buchung bleiben bei dir.",
          },
          {
            title: "Direkte Zahlung auf dein Konto",
            desc: "Bezahlung direkt per Nequi, Bancolombia, Zahlungslink oder bar vor Ort.",
          },
          {
            title: "Direkter WhatsApp-Kontakt Gast–Gastgeber",
            desc: "Reisende schreiben dir mit 1 Klick für Reservierungen, Speisekarten oder Anfahrt.",
          },
          {
            title: "Automatische Übersetzung in 4 Sprachen",
            desc: "Dein Profil, Menü und deine Events sind auf Spanisch, Englisch, Französisch und Deutsch verfügbar.",
          },
        ],
      },
    },
    pillars: {
      eyebrow: "TECHNOLOGIE & PRÄSENZ VOR ORT",
      title: "Unsere Säulen für Reichweite & Vertrauen",
      subtitle:
        "Ultraschnelle Web-Technologie kombiniert mit physischen QR-Codes vor Ort.",
      items: [
        {
          badge: "WPO & Offline-PWA",
          title: "Ultraschnelle mobile Ansicht (auch ohne Empfang)",
          desc: "Optimiert für Berg- und Strandregionen. Speichert Inhalte offline auf dem Smartphone.",
        },
        {
          badge: "Präsenz vor Ort",
          title: "Physisches QR-Code-Netzwerk in der Region",
          desc: "Aufsteller in Partner-Hostels, Restaurants, Geschäften und an Transportpunkten.",
        },
        {
          badge: "Verifiziertes Vertrauen",
          title: "Georeferenzierte Profile & Google-Maps-Sterne",
          desc: "Zeigt deine echte Google-Maps-Bewertung samt direkter Routenführung und WhatsApp-Kontakt.",
        },
      ],
    },
    plans: {
      eyebrow: "TRANSPARENTE MODELLE",
      title: "Klare Quartalspläne & 15 Tage kostenlos testen",
      subtitle:
        "Überzeuge dich 15 Tage lang kostenlos von den Ergebnissen – ohne Vertragsbindung.",
      courtesyBanner: {
        badge: "🎁 WILLKOMMENSBONUS",
        title: "15 Tage kostenlos testen zur Validierung",
        desc: "Wir erstellen und übersetzen dein Profil kostenlos in 4 Sprachen. Nach 15 Tagen erhältst du einen Bericht über Aufrufe und WhatsApp-Klicks.",
        cta: "15 kostenlose Testtage anfordern →",
      },
      cycleBadge: "Quartalsmodelle • 0% Provision",
      modalities: [
        {
          id: "hospedajes",
          emoji: "🏡",
          badge: "Unterkünfte",
          title: "Hotels, Eco-Lodges & Hostels",
          subtitle: "Direktbuchungen ohne 20% OTA-Provision.",
          features: [
            "Interaktiver Aufenthaltsrechner nach Zimmerkategorie und Nächten",
            "Optimierte HD-Fotogalerie (WebP) & Video-Reels",
            "Offizielle Google-Maps-Bewertung und Rezensionen",
            "Direkter WhatsApp-Buchungsbutton in 4 Sprachen",
          ],
          cta: "Unterkunft eintragen",
          waMessage:
            "Hallo PaDónde! 🏡 Ich betreibe eine Unterkunft und möchte die 15 kostenlosen Testtage aktivieren.",
        },
        {
          id: "gastronomia",
          emoji: "🍽️",
          badge: "Live-Kalender & Erlebnisse",
          title: "Gastronomie, Touren, Wellness & Events",
          subtitle: "Ideal für Restaurants, Cafés, Bars, Tour-Anbieter und Wellness-Zentren.",
          features: [
            "Veröffentlichung täglicher, wiederkehrender oder dauerhafter Angebote",
            "Interaktive mehrsprachige digitale Speisekarte mit Preisen und Fotos",
            "Top-Platzierung in den Filtern 'Heute', 'Morgen' und 'Wochenende'",
            "Schnelle Aktualisierung per WhatsApp-Nachricht an unser Team",
          ],
          cta: "Restaurant / Tour eintragen",
          waMessage:
            "Hallo PaDónde! 🍽️🌿 Ich habe ein Restaurant / eine Tour und möchte die 15 kostenlosen Testtage starten.",
        },
        {
          id: "esenciales",
          emoji: "🛵",
          badge: "Nützliche Infos",
          title: "Wichtige Dienste & Lokales Gewerbe",
          subtitle: "Dauerhafte Sichtbarkeit für wichtige Dienstleistungen vor Ort.",
          features: [
            "Präsenz im Reiter 'Nützliche Infos & Dienste' deines Reiseziels",
            "Transport/Motorradtaxis, Bargeld/Wechselstuben, Apotheken und Läden",
            "Öffnungszeiten, Google-Maps-Standort und 1-Klick-WhatsApp-Kontakt",
            "Fairer Quartalstarif für lokale Dienstleister",
          ],
          cta: "Lokalen Dienst eintragen",
          waMessage:
            "Hallo PaDónde! 🛵 Ich biete einen lokalen Dienst an und möchte in 'Nützliche Infos' aufgenommen werden.",
        },
      ],
    },
    faq: {
      eyebrow: "HÄUFIGE FRAGEN",
      title: "Fragen & Antworten für Partner",
      subtitle: "Alles Wichtige vor dem Start.",
      items: [
        {
          q: "Wie erhalte ich das Geld für meine Reservierungen?",
          a: "100% der Zahlung gehen direkt vom Gast an dich (per Nequi, Bancolombia, Zahlungslink oder bar). PaDónde behält keinerlei Provision ein.",
        },
        {
          q: "Was passiert nach den 15 kostenlosen Testtagen?",
          a: "Du erhältst eine Übersicht über deine Aufrufe und WhatsApp-Anfragen. Wenn du zufrieden bist, aktivierst du deinen Quartalsplan; andernfalls wird dein Eintrag ohne Kosten pausiert.",
        },
        {
          q: "Wie aktualisiere ich Fotos, Events oder meine Speisekarte?",
          a: "Sende uns einfach eine kurze WhatsApp-Nachricht oder ein Foto – unser Team aktualisiert und übersetzt dein Profil umgehend.",
        },
        {
          q: "Werden meine Einträge wirklich in 4 Sprachen angezeigt?",
          a: "Ja, automatisch auf Spanisch, Englisch, Französisch und Deutsch für internationale Gäste.",
        },
      ],
    },
    finalCta: {
      title: "Bereit, dein Unternehmen direkt mit Reisenden in unserer Region zu verbinden?",
      subtitle: "Schreibe uns auf WhatsApp und starte noch heute deine 15 kostenlosen Testtage.",
      primaryCta: "Auf WhatsApp schreiben & Test starten",
      secondaryCta: "Minca-Kalender entdecken",
    },
  },
};

export function getAliadosCopy(locale: string): AliadosCopy {
  return ALIADOS_COPY[locale] || ALIADOS_COPY.es;
}

