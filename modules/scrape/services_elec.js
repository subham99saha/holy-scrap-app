const { BrowserWindow } = require('electron'); // Use Electron's BrowserWindow to run in the background
const fs = require('fs');
const cheerio = require('cheerio');

let mainWindowRef = null;

// Initialize the message sender with the mainWindow
function initializeMessageSender(mainWindow) {
  mainWindowRef = mainWindow;
}

// Function to send messages from anywhere in this file
function sendMessageToFrontend(message) {
  if (mainWindowRef && mainWindowRef.webContents) {
    mainWindowRef.webContents.send('message-from-backend', message);
  } else {
    console.error('No mainWindowRef or webContents found');
  }
}

// Utility function for scrolling the page
async function autoScroll(win, distance, maxTime) {
    const startT = Date.now();
    await win.webContents.executeJavaScript(`
        new Promise((resolve) => {
            let totalHeight = 0;
            const distance = ${distance}; // Scroll distance
            const maxTime = ${maxTime}; // Maximum time to scroll in milliseconds
            const startTime = Date.now();

            let lastHeight = document.body.scrollHeight; // Keep track of the last height
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                const elapsedTime = Date.now() - startTime;

                // Check if new content has loaded
                setTimeout(() => {
                    const newHeight = document.body.scrollHeight;

                    if (newHeight > lastHeight) {
                        lastHeight = newHeight; // Update last known height and continue scrolling
                    } else if (elapsedTime > maxTime || totalHeight >= newHeight) {
                        if (elapsedTime > maxTime) {
                            console.log('Time elapsed')
                        } else {
                            console.log('Page end reached') 
                        }
                        clearInterval(timer);
                        resolve();
                    }
                    console.log('Waited for 5 seconds!')
                }, 3000); // Wait for 5 seconds for new content to load before checking
                console.log('Scrolled distance (pixels): ',distance)
            }, 2000); // Scroll every 2000 milliseconds for more frequent, smaller scrolls
        });
    `);
    const endT = Date.now(); // Record the end time
    const timeTaken = (endT - startT) / 1000; // Calculate time taken in seconds
    // console.log(`Scraping completed in ${timeTaken} seconds for ${site}`);
    console.log(`Auto-scrolled completed in ${timeTaken} seconds`);
}

// Utility function to wait for images to load
async function waitForImagesToLoad(win) {
    await win.webContents.executeJavaScript(`
        new Promise((resolve) => {
            const images = document.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return;
                return new Promise((res) => {
                    img.onload = img.onerror = res;
                });
            });
            Promise.all(imagePromises).then(resolve);
        });
    `);
}

async function paginatorScriptText(pagerClass,productClass) {
    let code = `
        new Promise((resolve, reject) => {
            try {
                const nextButton = document.querySelector('${pagerClass}');
                if (nextButton) {
                    nextButton.click();
                    const checkLoaded = setInterval(() => {
                        if (document.querySelector('${productClass}')) {
                            clearInterval(checkLoaded);
                            resolve(true);
                        }
                    }, 500);
                } else {
                    resolve(false);
                }
            } catch (e) {
                throw e;
            } 
        });
    `;
    return code
}

const amazonScraper = ($) => {
    let scraped = []
    $('.s-result-item[data-component-type="s-search-result"]').each((index, element) => {
        const imageElement = $(element).find('.s-image');
        const titleElement = $(element).find('h2 a.a-link-normal');
        const priceElement = $(element).find('.a-price[data-a-strike="true"] .a-offscreen');
        const discountedPriceElement = $(element).find('.a-price[data-a-color="base"] .a-offscreen');
        const ratingElement = $(element).find('.a-icon-star-small');
        const ratingCountElement = $(element).find('.a-size-base.s-underline-text');

        // Push the product details into the products array
        scraped.push({
            site: 'AMZN',
            imageUrl: imageElement.length ? imageElement.attr('src') : null,
            brand: null,
            productTitle: titleElement.length ? titleElement.text().trim() : null,
            price: priceElement.length ? priceElement.text().replace('₹', '').replace(',', '').trim() : 0,
            discountedPrice: discountedPriceElement.length ? discountedPriceElement.text().replace('₹', '').replace(',', '').trim() : 0,
            itemLink: titleElement.length ? 'https://www.amazon.in' + titleElement.attr('href') : null,
            rating: ratingElement.length ? parseFloat(ratingElement.text().split(' ')[0]) : 0,
            ratingCount: ratingCountElement.length ? parseInt(ratingCountElement.text().replace(/[^0-9]/g, '').replace(',', '')) : 0
        });
    });
    return scraped
}

const myntraScraper = ($) => {
    let scraped = []
    $('.product-base').each((index, element) => {
        const imageElement = $(element).find('img');
        const brandElement = $(element).find('.product-brand');
        const titleElement = $(element).find('.product-product');
        const discountedPriceElement = $(element).find('.product-discountedPrice') || $(element).find('.product-price span');
        const originalPriceElement = $(element).find('.product-strike');
        const ratingElement = $(element).find('.product-ratingsContainer span');
        const ratingCountElement = $(element).find('.product-ratingsCount');
        const itemLink = $(element).find("a");

        scraped.push({
            site: 'MTRA',
            imageUrl: imageElement.length ? imageElement.attr('src') : null,
            brand: brandElement.length ? brandElement.text().trim() : null,
            productTitle: titleElement.length ? titleElement.text().trim() : null,
            price: originalPriceElement.length ? originalPriceElement.text().replace('Rs. ', '').replace(',', '').trim() : 0,
            discountedPrice: discountedPriceElement.length ? discountedPriceElement.text().replace('Rs. ', '').replace(',', '').trim() : 0,
            rating: ratingElement.length ? parseFloat(ratingElement.text()) : 0,
            ratingCount: ratingCountElement.length ? parseFloat(ratingCountElement.contents().eq(2).text().replace('k', '').replace(',', '')) * (ratingCountElement.contents().eq(2).text().includes('k') ? 1000 : 1) : 0,
            itemLink: itemLink.length ? 'https://www.myntra.com/' + itemLink.attr('href') : null
        });
    });
    return scraped
}

const flipkartScraper = ($) => {
    let scraped = []
    $('div[data-id]').each((i, el) => {
        const imageElement = $(el).find('img');
        const itemLink = $(el).find('a');
    
        let brand = $(el).find('.syl9yP').text().trim();
        let title = $(el).find('.KzDlHZ').text().trim() ||
                    $(el).find('.wjcEIp, .WKTcLC, a').text().trim() || 
                    $(el).find('.syl9yP').text().trim() ||
                    $(el).find('.wjcEIp, .WKTcLC, a[title]').attr('title') || "0";
    
        const discountPriceElement = $(el).find('div.Nx9bqj');
        const discountPrice = discountPriceElement.length ? discountPriceElement.text().trim() : 0;
    
        const originalPriceElement = $(el).find('div.yRaY8j');
        const originalPrice = originalPriceElement.length ? originalPriceElement.text().trim() : 0;
    
        const rating = $(el).find('.XQDdHH').text().trim() || 0;
    
        const ratingCount = $(el).find('.Wphh3N').text().replace(/[()]/g, '').replace(',', '').trim() || 0;
    
        scraped.push({
            site: 'FLPKT',
            imageUrl: imageElement.length ? imageElement.attr('src') : null,
            brand,
            productTitle: title || null,
            price: originalPrice ? originalPrice.replace('₹', '').replace(',', '') : 0,
            discountedPrice: discountPrice ? discountPrice.replace('₹', '').replace(',', '') : 0,
            itemLink: itemLink.length ? 'https://www.flipkart.com' + itemLink.attr('href') : null,
            rating,
            ratingCount
        });
    });
    return scraped
}

const ajioScraper = ($) => {
    let scraped = []
    $('.preview').each((index, element) => {
        const imageElement = $(element).find('.imgHolder img');
        const brandElement = $(element).find('.brand');
        const nameElement = $(element).find('.nameCls');
        const ratingElement = $(element).find('.contentHolder ._1gIWf p._3I65V');
        const ratingCountElement = $(element).find('._2mae- p:not(._3I65V)');
        const priceElement = $(element).find('.price strong');
        const originalPriceElement = $(element).find('.orginal-price');
        const discountedPriceElement = $(element).find('.contentHolder ._305pl div strong span span');

        scraped.push({
            site: 'AJIO',
            imageUrl: imageElement.length ? imageElement.attr('src') : null,
            brand: brandElement.length ? brandElement.text().trim() : null,
            productTitle: nameElement.length ? nameElement.text().trim() : null,
            price: originalPriceElement.length ? originalPriceElement.text().replace('₹', '').replace(',', '').trim() : 0,
            discountedPrice: priceElement.length ? priceElement.text().replace('₹', '').replace(',', '').trim() : 0,
            itemLink: imageElement.length ? 'https://www.ajio.com' + imageElement.closest('a').attr('href') : null,
            rating: ratingElement.length ? parseFloat(ratingElement.text().trim()) : 0,
            ratingCount: ratingCountElement.length ? 
                parseFloat(ratingCountElement.text().trim().replace('| ', '').replace('k', '').replace(',', '')) *
                (ratingCountElement.text().includes('k') ? 1000 : 1) : 0
        });
    });
    return scraped
}

const scrapeBot = (site, query, distance, maxtime, maxPages, _url, scraper, pagerClass, productClass) => new Promise(async (resolve, reject) => {
    // console.log({query, distance, maxtime, maxPages, _url, pagerClass, productClass})
    let q = query.replace(/\s+/g, '+');
    console.log({ query: q });
    const url = `${_url}${q}`;
    let products = [];

    // Create a hidden BrowserWindow (headless behavior)
    let win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });
    // win.maximize();

    // Set user-agent to avoid bot detection
    win.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    console.log('User agent set');

    let currentPage = 1;

    const loadAndScrapePage = async () => {
        try {
            if (currentPage > 1) {
                // Click the "Next" button
                const nextPageLoaded = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
                    try {
                        const nextButton = document.querySelector('${pagerClass}');
                        if (nextButton) {
                            console.log('Next Page Button found')
                            nextButton.click();
                            const checkLoaded = setInterval(() => {
                                if (document.querySelector('${productClass}')) {
                                    clearInterval(checkLoaded);
                                    resolve(true);
                                }
                            }, 500);
                        } else {
                            console.log('Next Page Button not found')
                            resolve(false);
                        }
                    } catch (e) {
                        throw e;
                    } 
                });`);
                if (!nextPageLoaded) {
                    console.log('No more pages to load');
                    return false;
                }
                console.log(`Page ${currentPage} loaded successfully`);
            }

            // Execute auto scroll logic inside the `webContents`
            await autoScroll(win, distance, maxtime);

            // Retrieve HTML content after scrolling and loading images
            const html = await win.webContents.executeJavaScript(`
                function getHtml() {
                    return new Promise((resolve, reject) => { 
                        resolve(document.documentElement.innerHTML); 
                    });
                }
                getHtml();
            `);
            console.log('HTML retrieved successfully');

            // Use Cheerio to parse the HTML and extract product details
            const $ = cheerio.load(html);

            let scraped = scraper($)
            // console.log({scraped})
            products.push(...scraped)

            console.log(`Products scraped after page ${currentPage}:`, products.length);
            sendMessageToFrontend({ site, text: `${products.length} products scraped till page number ${currentPage}` });

            currentPage++;
            return true;

        } catch (error) {
            console.error(`Error scraping data on page ${currentPage}:`, error);
            return false;
        }
    };

    try {
        // Load the search URL
        await win.loadURL(url);
        console.log('Page loaded');

        let morePages = true;

        // Loop to load and scrape multiple pages
        while (currentPage <= maxPages && morePages) {
            morePages = await loadAndScrapePage();
        }

        // console.log({products})
        resolve(products);

    } catch (error) {
        console.error('Error during scraping:', error);
        reject(error);
    } finally {
        // Close the hidden window once scraping is complete
        if (win) {
            win.close();
        }
    }
});

module.exports = {
    fetchProducts: async (payload) => {
        console.log({payload})
        const { query, site, distance, maxtime, maxpages } = payload
        let items = []
        try {
            const startT = Date.now(); // Record the start time
            if (site === 'AMZN') {
                // const response = await scrapeAmazon(query)
                const response = await scrapeBot(site,query,distance,maxtime,maxpages,'https://www.amazon.in/s?k=',amazonScraper,'.s-pagination-next','.s-result-item[data-component-type="s-search-result"]')
                items.push(...response)
                console.log("Amazon scraped \n")
            }
            if (site === 'FLPKT') {
                // const response = await scrapeFlipkart(query)
                const response = await scrapeBot(site,query,distance,maxtime,maxpages,'https://www.flipkart.com/search?q=',flipkartScraper,'._9QVEpD','div[data-id]')
                items.push(...response)
                console.log("Flipkart scraped \n")
            }
            if (site === 'MTRA') {
                const response = await scrapeBot(site,query,distance,maxtime,maxpages,'https://www.myntra.com/',myntraScraper,'li.pagination-next','.product-base')
                items.push(...response)
                console.log("Myntra scraped \n")
            }
            if (site === 'AJIO') {
                const response = await scrapeBot(site,query,distance,maxtime,maxpages,'https://www.ajio.com/search/',ajioScraper,'','.preview')
                // const response = await scrapeAjio(site,query,distance,maxtime)
                items.push(...response)
                console.log("Ajio scraped \n")
            }
            const endT = Date.now(); // Record the end time
            const timeTaken = (endT - startT) / 1000; // Calculate time taken in seconds
            console.log(`Scraping completed in ${timeTaken} seconds for ${site}`);
            sendMessageToFrontend({ site, text: `Scraping completed in ${timeTaken} seconds for ${site}` });

            return { success: true, message: items };
        } catch(error) {
            return { success: false, message: error };
        }
    },
    initializeMessageSender
}