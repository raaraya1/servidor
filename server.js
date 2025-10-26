import express from "express";
import fs from "fs";
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
        "--window-size=1280,900",
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // 🔹 Cargar cookies desde archivo
    const cookies = JSON.parse(fs.readFileSync("./cookies.json", "utf8"));
    await page.setCookie(...cookies);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.118 Safari/537.36"
    );

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Simular scroll para cargar más resultados
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((r) => setTimeout(r, 2500));
    }

    // Extraer los enlaces click1
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
