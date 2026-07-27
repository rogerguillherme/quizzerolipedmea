// Helper thin para o Meta Pixel (fbq) — seguro para SSR.
type FbqParams = Record<string, unknown>;

export function fbqTrack(event: string, params?: FbqParams) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  try {
    if (params) fbq("track", event, params);
    else fbq("track", event);
  } catch (err) {
    console.warn("[meta-pixel] falha ao enviar evento", event, err);
  }
}

export function fbqTrackCustom(event: string, params?: FbqParams) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq !== "function") return;
  try {
    if (params) fbq("trackCustom", event, params);
    else fbq("trackCustom", event);
  } catch (err) {
    console.warn("[meta-pixel] falha ao enviar evento custom", event, err);
  }
}
