import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { trackMeta } from "../lib/meta-track";
import {
  capturarAtribuicao,
  enviarBeacon,
  getAtribuicao,
  getSessionId,
  normalizePath,
} from "../lib/atribuicao";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo não carregou como deveria
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte para a tela inicial.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // maximum-scale=1 impede o zoom automático do iOS ao focar inputs no quiz
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0B2A4A" },
      { title: "Mapa do Lipedema — leitura gratuita com Gabriela Rosado" },
      {
        name: "description",
        content:
          "Descubra em 3 minutos o retrato clínico do seu lipedema. Leitura gratuita feita pela IA da especialista Gabriela Rosado (CRN 10582), entregue pelo WhatsApp.",
      },
      { name: "author", content: "Zero Lipedema · Gabriela Rosado CRN 10582" },
      { property: "og:title", content: "Mapa do Lipedema — leitura gratuita com Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Descubra em 3 minutos o retrato clínico do seu lipedema. Leitura gratuita feita pela IA da especialista Gabriela Rosado (CRN 10582), entregue pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Zero Lipedema" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Mapa do Lipedema — leitura gratuita com Gabriela Rosado" },
      { name: "twitter:description", content: "Descubra em 3 minutos o retrato clínico do seu lipedema. Leitura gratuita feita pela IA da especialista Gabriela Rosado (CRN 10582), entregue pelo WhatsApp." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9260e33e-b220-431a-b008-9a807451410d/id-preview-e01ed8a6--4a9b7442-01d5-4766-8c69-f473718afe8b.lovable.app-1784680241356.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9260e33e-b220-431a-b008-9a807451410d/id-preview-e01ed8a6--4a9b7442-01d5-4766-8c69-f473718afe8b.lovable.app-1784680241356.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/__l5e/assets-v1/0470e9df-7d83-4485-aea3-38b131cddaea/logo-zero-lipedema.png" },
      { rel: "apple-touch-icon", href: "/__l5e/assets-v1/0470e9df-7d83-4485-aea3-38b131cddaea/logo-zero-lipedema.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const META_PIXEL_ID = "1193334139413501";

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
`,
          }}
        />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    // Primeiro toque precisa ser capturado antes de qualquer navegação interna.
    capturarAtribuicao();
    const sid = getSessionId();
    let ultimoPath = "";
    const enviarPageview = () => {
      const path = normalizePath();
      // onResolved dispara também em mudanças de search/hash: evita duplicar.
      if (path === ultimoPath) return;
      ultimoPath = path;
      trackMeta("PageView");
      const atribuicao = getAtribuicao();
      enviarBeacon("/api/public/track", {
        // Só o pathname: query e hash vão em campos próprios.
        path,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        session_id: sid,
        utm_source: atribuicao.utm_source ?? null,
        utm_medium: atribuicao.utm_medium ?? null,
        utm_campaign: atribuicao.utm_campaign ?? null,
      });
    };
    // A primeira carga não passa por onResolved: dispara na montagem.
    enviarPageview();
    const unsub = router.subscribe("onResolved", enviarPageview);

    return () => unsub();
  }, [router]);

  useEffect(() => {
    const KEY = "__chunk_reload_at";
    const onErr = (msg: string) => {
      if (!/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) return;
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 10_000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    };
    const onError = (e: ErrorEvent) => onErr(e?.message || "");
    const onRej = (e: PromiseRejectionEvent) => onErr(String((e?.reason as any)?.message || e?.reason || ""));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
