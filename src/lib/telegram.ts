import { createClient } from "@/lib/supabase/server";

export interface TelegramConfig {
  activas: boolean;
  bot_token?: string;
  chat_id?: string;
}

/**
 * Obtiene la configuración de notificaciones de Telegram:
 * Prioriza la tabla Supabase 'configuraciones' (para pausar/activar en tiempo real desde el Admin)
 * con fallback a las variables de entorno.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuraciones")
      .select("valor")
      .eq("clave", "notificaciones_telegram")
      .maybeSingle();

    if (data?.valor && typeof data.valor === "object") {
      return {
        activas: data.valor.activas ?? true,
        bot_token: data.valor.bot_token || process.env.TELEGRAM_BOT_TOKEN,
        chat_id: data.valor.chat_id || process.env.TELEGRAM_CHAT_ID,
      };
    }
  } catch (err) {
    console.warn("Aviso al leer configuración de Telegram en BD:", err);
  }

  return {
    activas: true,
    bot_token: process.env.TELEGRAM_BOT_TOKEN,
    chat_id: process.env.TELEGRAM_CHAT_ID,
  };
}

/**
 * Envía una notificación a Telegram en segundo plano de forma no bloqueante.
 */
export async function sendTelegramNotification(htmlMessage: string): Promise<boolean> {
  try {
    const config = await getTelegramConfig();
    if (!config.activas || !config.bot_token || !config.chat_id) {
      return false;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${config.bot_token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chat_id,
          text: htmlMessage,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    return res.ok;
  } catch (error) {
    console.warn("Error enviando notificación a Telegram:", error);
    return false;
  }
}
