import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getAppSettings, setAppSetting } from "@/lib/settings.functions";
import { enviarMapaPdf } from "@/lib/mapa-html.functions";

const APP_KEY = "mapa";
const SETTING_KEY = "template_html";

// Acha todos os {{token}} do HTML, na ordem em que aparecem, sem repetir.
function extrairVariaveis(html: string): string[] {
  const vistos = new Set<string>();
  const ordem: string[] = [];
  for (const m of html.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    const chave = m[1];
    if (!vistos.has(chave)) {
      vistos.add(chave);
      ordem.push(chave);
    }
  }
  return ordem;
}

function resolverVariaveis(html: string, valores: Record<string, string>): string {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, chave) => valores[chave] ?? chave);
}

export function MapaHtmlDialog({
  leadId,
  nomeLead,
}: {
  leadId: string;
  nomeLead: string;
}) {
  const [open, setOpen] = useState(false);
  const fetchSettings = useServerFn(getAppSettings);
  const saveSetting = useServerFn(setAppSetting);
  const enviar = useServerFn(enviarMapaPdf);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["app-settings", APP_KEY],
    queryFn: () => fetchSettings({ data: { app_key: APP_KEY } }),
    enabled: open,
  });

  const [html, setHtml] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open || isLoading) return;
    const salvo = (data?.[SETTING_KEY] as string | undefined) ?? "";
    setHtml(salvo);
    setDirty(false);
  }, [open, isLoading, data]);

  useEffect(() => {
    if (!dirty) setValores((v) => ({ nome: nomeLead, ...v }));
  }, [nomeLead, dirty]);

  const variaveis = useMemo(() => extrairVariaveis(html), [html]);

  const saveMut = useMutation({
    mutationFn: () =>
      saveSetting({ data: { app_key: APP_KEY, setting_key: SETTING_KEY, value: html } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app-settings", APP_KEY] });
      setDirty(false);
    },
  });

  const enviarMut = useMutation({
    mutationFn: () =>
      enviar({ data: { leadId, html: resolverVariaveis(html, valores) } }),
    onSuccess: (r) => {
      if (r.ok) {
        alert("Mapa enviado no WhatsApp ✓");
        setOpen(false);
      } else {
        alert(`Falhou: ${r.erro ?? "erro"}`);
      }
    },
    onError: (e: Error) => alert(`Erro: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
        >
          <FileText className="size-3" /> Enviar Mapa (PDF)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapa do Lipedema — {nomeLead}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>Template HTML</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saveMut.isPending}
                  onClick={() => saveMut.mutate()}
                >
                  {saveMut.isPending ? "Salvando…" : "Salvar template"}
                </Button>
              </div>
              <Textarea
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  setDirty(true);
                }}
                rows={10}
                className="font-mono text-xs"
                placeholder="Cole aqui o HTML com {{variaveis}}"
              />
            </div>

            {variaveis.length > 0 && (
              <div className="space-y-2">
                <Label>Parâmetros antes de enviar</Label>
                {variaveis.map((chave) => (
                  <div key={chave} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 truncate font-mono text-xs text-muted-foreground">
                      {chave}
                    </span>
                    <Input
                      value={valores[chave] ?? chave}
                      onChange={(e) =>
                        setValores((v) => ({ ...v, [chave]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              disabled={!html || enviarMut.isPending}
              onClick={() => enviarMut.mutate()}
              className="w-full"
            >
              {enviarMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Enviar PDF no WhatsApp
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
