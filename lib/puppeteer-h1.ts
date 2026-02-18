import puppeteer from "puppeteer"

export async function extractH1WithPuppeteer(url: string): Promise<string[]> {
  let browser
  try {
    console.log("[v0] Launching Puppeteer to extract H1 from:", url)
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })

    const page = await browser.newPage()
    
    // Set a reasonable timeout
    await page.goto(url, { 
      waitUntil: "domcontentloaded",
      timeout: 10000 
    })

    // Wait a moment for JS to render
    await page.waitForTimeout(1000)

    // Extract all H1 text content
    const h1Texts = await page.evaluate(() => {
      const h1Elements = document.querySelectorAll("h1")
      return Array.from(h1Elements).map((el) => {
        const text = el.textContent?.trim() || ""
        return text.slice(0, 120) // Truncate to 120 chars
      }).filter(text => text.length > 0)
    })

    console.log("[v0] Puppeteer found H1s:", h1Texts.length, h1Texts)
    return h1Texts

  } catch (error) {
    console.error("[v0] Puppeteer H1 extraction failed:", error)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
