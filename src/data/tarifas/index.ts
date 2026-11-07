import aventura4x4Data from "./aventura4x4.json";
import mincaVipData from "./mincaVip.json";
import type { TarifarioTransporte } from "./types";

export * from "./types";

export const TARIFARIOS_REGISTRY: Record<string, TarifarioTransporte> = {
  "transporte-aventura-4x4-minca": aventura4x4Data as unknown as TarifarioTransporte,
  "transporte-minca-vip": mincaVipData as unknown as TarifarioTransporte,
};

export function getTarifarioPorId(id: string): TarifarioTransporte | null {
  return TARIFARIOS_REGISTRY[id] || null;
}
