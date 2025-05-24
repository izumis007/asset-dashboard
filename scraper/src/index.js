const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:8000';

// Money Forward scraper function
async function scrapeMoneyForward(email, password) {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to Money Forward login page
    await page.goto('https://moneyforward.com/sign_in', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Login
    await page.type('input[name="sign_in_session_service[email]"]', email);
    await page.type('input[name="sign_in_session_service[password]"]', password);
    
    // Click login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('input[type="submit"]')
    ]);

    // Wait for dashboard to load
    await page.waitForSelector('.heading-accounts', { timeout: 30000 });

    // Navigate to accounts page
    await page.goto('https://moneyforward.com/accounts', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Scrape account balances
    const balances = await page.evaluate(() => {
      const accounts = [];
      
      // Get all account rows
      const accountRows = document.querySelectorAll('.account-table tbody tr');
      
      accountRows.forEach(row => {
        const institutionElement = row.querySelector('.account');
        const balanceElement = row.querySelector('.number');
        
        if (institutionElement && balanceElement) {
          const institution = institutionElement.textContent.trim();
          const balanceText = balanceElement.textContent.trim();
          
          // Parse balance (remove currency symbols and convert)
          const balance = parseFloat(
            balanceText
              .replace(/[¥,$,]/g, '')
              .replace(/,/g, '')
          );

          if (!isNaN(balance)) {
            accounts.push({
              institution: institution,
              amount: balance,
              currency: 'JPY' // Assuming JPY for now
            });
          }
        }
      });

      return accounts;
    });

    // Get cash balances specifically
    const cashBalances = balances.filter(account => {
      const lowerInstitution = account.institution.toLowerCase();
      return lowerInstitution.includes('bank') || 
             lowerInstitution.includes('銀行') ||
             lowerInstitution.includes('cash') ||
             lowerInstitution.includes('現金');
    });

    return {
      success: true,
      balances: cashBalances,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// API endpoint
app.post('/scrape', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  try {
    const result = await scrapeMoneyForward(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'money-forward-scraper' });
});

app.listen(PORT, () => {
  console.log(`Money Forward scraper listening on port ${PORT}`);
});