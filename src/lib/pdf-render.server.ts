// SERVER-ONLY — renderiza HTML (com @page/CSS de impressão) em PDF via Chromium headless.
// ponytail: puppeteer-core + @sparticuz/chromium é o par padrão para rodar Chromium em
// ambientes serverless (Vercel/Lambda-like). Se o runtime do Lovable não suportar lançar
// um binário Chromium, trocar por um serviço externo de HTML→PDF é o upgrade natural.

export async function renderHtmlToPdf(html: string): Promise<string> {
  const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf).toString("base64");
  } finally {
    await browser.close();
  }
}
