export type CategoriaRutaTransporte =
  | "expresos"
  | "minca_locales_cercanos"
  | "sierra_alta_y_montana";

export interface ItemTarifaTransporte {
  destino: string;
  precio: number;
  tiempoAprox?: string;
  tags?: string[];
}

export interface TarifarioTransporte {
  id: string;
  nombre: string;
  region: string;
  categoria: string;
  subcategoria: string;
  contacto: {
    telefono: string;
    whatsapp: string;
    whatsapp_url?: string;
  };
  condiciones: {
    capacidad: string;
    tipo_vehiculo: string;
    moneda: string;
  };
  tarifas: {
    expresos: ItemTarifaTransporte[];
    minca_locales_cercanos: ItemTarifaTransporte[];
    sierra_alta_y_montana: ItemTarifaTransporte[];
    [key: string]: ItemTarifaTransporte[];
  };
}
