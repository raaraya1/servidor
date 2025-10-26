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
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    console.log(`🌐 Navegando a ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 🔹 Esperar explícitamente a que se carguen los enlaces click1 (dinámicos)
    await page.waitForSelector('a[href^="https://click1"]', { timeout: 30000 });

    // 🔹 Extraer todos los enlaces click1 visibles
    const links = await page.$$eval('a[href^="https://click1"]', as =>
      as.map(a => a.href.trim())
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
