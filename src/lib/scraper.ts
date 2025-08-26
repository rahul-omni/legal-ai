export async function performScrapeWithRetries(url: string, payload: any, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const res = await scrapeHighCourt(url, payload);
      console.log(`Scrape attempt ${attempt} took ${Date.now() - start}ms`);
      return res;
    } catch (err: any) {
      const msg = err?.message || '';
      const isTimeout = /timed out|timeout|waiting for function failed/i.test(msg);
      const isNetwork = /network|ECONNRESET|ENOTFOUND|ECONNREFUSED/i.test(msg);

      console.error(`Scrape attempt ${attempt} failed:`, msg);

      if (attempt < retries && (isTimeout || isNetwork)) {
        const backoff = 1000 * Math.pow(2, attempt - 1);
        console.log(`Retrying scrape in ${backoff}ms (attempt ${attempt + 1} of ${retries})`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      // rethrow so caller can handle and log appropriately
      throw err;
    }
  }
}
// Provide a small object with .fire to keep existing usage unchanged


export async function scrapeHighCourt(url: string, payload: any) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Scraper responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (data.error) {
      console.error('Scraper service error:', data.error);
      return { success: false, error: data.error };
    }
    
    return {
      success: true,
      result: data.result || data.data || [],
      processedResults: data.processedResults || data.result || []
    };
  } catch (err) {
    console.error("Scraping error:", err);
    return { 
      success: false, 
      error:   'Unknown error',
        
    };
  }
}


export const scraperCircuitBreaker = {
  fire: performScrapeWithRetries
};