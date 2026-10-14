"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { CATEGORIAS } from "@/constants";
import { uploadEventImage } from "@/lib/supabase/storage";
import { adminPublishEventAction } from "../actions";
import { Button } from "@/components/ui/Button";
import type { CategoriaEvento } from "@/lib/types";

export function AdminPublishForm({ defaultZona = "minca" }: { defaultZona?: string }) {
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [category, setCategory] = useState<CategoriaEvento>("comida");
  const [dateTime, setDateTime] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl: string | undefined = undefined;

      if (file) {
        const uploaded = await uploadEventImage(file);
        if (uploaded) finalImageUrl = uploaded;
      }

      const result = await adminPublishEventAction({
        businessName,
        whatsapp,
        instagram,
        eventTitle,
        category,
        dateTime: dateTime || new Date().toISOString(),
        price: parseFloat(price) || 0,
        description,
        imageUrl: finalImageUrl,
        isFeatured,
        zonaSlug: defaultZona,
      });

      if (!result.success) {
        setError(result.error || "Ocurrió un error al guardar.");
        setLoading(false);
        return;
      }

      setCreatedEventId(result.eventId || null);
    } catch (err) {
      console.error(err);
      setError("Error inesperado al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (createdEventId) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-stone-light text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-forest text-cream flex items-center justify-center text-3xl mx-auto">
          🌿
        </div>
        <div>
          <h2 className="font-serif text-2xl text-forest">¡Evento publicado exitosamente!</h2>
          <p className="font-sans text-xs text-stone mt-1.5">
            El plan ya está visible en vivo en la cartelera de Minca.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href={`/${defaultZona}/${createdEventId}`}>
            <Button size="lg" className="w-full">
              Ver evento en vivo
            </Button>
          </Link>

          <Link href="/admin">
            <Button variant="outline" size="md" className="w-full">
              Volver al panel admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
          ⚠️ {error}
        </div>
      )}

      {/* 1. NEGOCIO */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <h2 className="font-serif text-lg text-forest flex items-center gap-2">
          <span>📍</span> 1. Negocio / Anfitrión
        </h2>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Nombre del Negocio *
          </label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ej. Café Sierra, Hostal Casa Loma..."
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Número de WhatsApp *
          </label>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="573001234567"
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
          <p className="text-[11px] text-stone mt-1">Con código de país (ej. 57) sin espacios.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Instagram (opcional)
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@casaloma"
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>
      </section>

      {/* 2. EVENTO */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <h2 className="font-serif text-lg text-forest flex items-center gap-2">
          <span>📅</span> 2. Detalles del Evento
        </h2>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Título del Plan *
          </label>
          <input
            type="text"
            required
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Ej. Cata de Café de Origen..."
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-2 font-sans">
            Categoría *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={[
                  "flex flex-col items-center gap-1 p-2.5 rounded-2xl text-xs font-sans transition-all duration-150 cursor-pointer",
                  category === cat.id
                    ? "bg-forest text-white shadow-sm"
                    : "bg-cream border border-stone-light/60 text-stone hover:text-forest",
                ].join(" ")}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="text-[11px] truncate w-full text-center">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
              Precio COP (0 = Gratis) *
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-forest mb-1.5 font-sans">
            Descripción detallada
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalla de qué trata, qué incluye, qué llevar..."
            className="w-full px-4 py-3 rounded-xl border border-stone-light bg-cream text-forest text-sm font-sans focus:outline-none focus:border-forest transition-colors"
          />
        </div>
      </section>

      {/* 3. FOTO */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-stone-light/70 space-y-4">
        <h2 className="font-serif text-lg text-forest flex items-center gap-2">
          <span>📸</span> 3. Imagen del Evento
        </h2>

        <div>
          <input
            type="file"
            accept="image/*"
            id="photo-admin-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="photo-admin-input"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-light hover:border-forest rounded-2xl cursor-pointer bg-cream transition-all duration-150"
          >
            {previewUrl ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-center space-y-2">
                <span className="text-3xl">📷</span>
                <p className="font-sans text-sm font-medium text-forest">
                  Seleccionar foto del plan
                </p>
                <p className="text-xs text-stone">JPG, PNG o WebP</p>
              </div>
            )}
          </label>
        </div>

        {/* Destacado */}
        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-terra/10 border border-terra/30 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 text-terra rounded border-stone-light focus:ring-terra"
          />
          <span className="font-sans text-xs font-semibold text-forest">
            ⭐ Fijar como evento Destacado arriba del feed (Plan Pago)
          </span>
        </label>
      </section>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full shadow-lg font-semibold py-4"
      >
        {loading ? "Publicando en Supabase..." : "Publicar Evento en PaDónde"}
      </Button>
    </form>
  );
}
