/**
 * Normaliza un texto para búsquedas insensibles a tildes, diacríticos y mayúsculas.
 * Útil para filtrar 100% en cliente (Client-Side) sin consumo de servidor ni base de datos.
 */
export function normalizarTextoBusqueda(texto?: string | null): string {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

