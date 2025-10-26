import express from "express";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing ?url parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,800",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // 🧠 Finge ser un navegador real de escritorio
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.118 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "accept-language": "es-CL,es;q=0.9,en;q=0.8",
    });

    // 🕵️ Evita detección de automatización
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    console.log(`🌐 Navegando a ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Esperar que cargue JS dinámico
    await new Promise((r) => setTimeout(r, 8000));

    // Buscar todos los enlaces click1
    const links = await page.$$eval('a[href^="https://click1"]', (as) =>
      as.map((a) => a.href.trim())
    );

    await browser.close();

    res.json({
      total: links.length,
      urls: [...new Set(links)],
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
