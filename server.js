import express from "express";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    const links = await page.$$eval('a[href^="https://click1"]', as =>
      as.map(a => a.href.trim())
    );

    await browser.close();
    res.json({ total: links.length, urls: [...new Set(links)] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
