import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Ponte cliente -> Meta Conversions API.
 * O navegador dispara o evento no Pixel com um eventID e chama esta função com
 * o MESMO eventID; a Meta deduplica os dois lados e o evento fica com match
 * quality melhor (IP, user agent, fbp/fbc e dados hasheados do lead).
 */
const schema = z.object({
  eventName: z.string().min(1).max(60),
  eventId: z.string().min(1).max(120),
  eventSourceUrl: z.string().max(1000).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  externalId: z.string().max(200).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(400).optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
});

export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { capiFromClient } = await import("@/lib/meta-capi.server");
    const res = await capiFromClient(data);
    return { ok: res.ok, status: res.status };
  });
