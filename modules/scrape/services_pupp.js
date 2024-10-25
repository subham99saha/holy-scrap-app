const puppeteer = require('puppeteer');

async function autoScroll(page, maxScrollHeight = 6000, maxTime = 10000) {
    const startT = Date.now(); // Record the start time

    await page.evaluate(async (maxScrollHeight, maxTime) => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const startTime = Date.now();
            
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                const elapsedTime = Date.now() - startTime;

                // if (totalHeight >= maxScrollHeight || totalHeight >= scrollHeight || elapsedTime > maxTime) {
                if (totalHeight >= scrollHeight || elapsedTime > maxTime) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }, maxScrollHeight, maxTime);

    const endT = Date.now(); // Record the end time
    const timeTaken = (endT - startT) / 1000; // Calculate time taken in seconds

    console.log(`Scroll completed in ${timeTaken} seconds`);
}


async function waitForImagesToLoad(page) {
    await page.evaluate(async () => {
        const images = document.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return;
            return new Promise((resolve) => {
                img.onload = img.onerror = resolve;
            });
        });
        await Promise.all(imagePromises);
    });
}

function replaceSpaces(query, replacement) {
    // Use the JavaScript string `replace` method with a regular expression to replace all spaces
    return query.replace(/\s+/g, replacement);
}

// async function scrapeAmazon(query) {
const scrapeAmazon = (query) => new Promise(async resolve => {
    let q = replaceSpaces(query,'+')
    console.log({query: q})
    const url = `https://www.amazon.in/s?k=${q}`;
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-http2']
    });
    console.log('puppeteer launched')
    
    const page = await browser.newPage();
    console.log('Browser newpaged')
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    console.log('user agent set')

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('goto done')
        // console.log({page})
        
        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]');
            return Array.from(productElements).map(el => {
                const imageElement = el.querySelector('.s-image');
                const titleElement = el.querySelector('h2 a.a-link-normal');
                const priceElement = el.querySelector('.a-price[data-a-strike="true"] .a-offscreen');
                const discountedPriceElement = el.querySelector('.a-price[data-a-color="base"] .a-offscreen');
                const ratingElement = el.querySelector('.a-icon-star-small');
                const ratingCountElement = el.querySelector('.a-size-base.s-underline-text');

                return {
                    imageUrl: imageElement ? imageElement.src : null,
                    productTitle: titleElement ? titleElement.textContent.trim() : null,
                    price: priceElement ? priceElement.textContent.replace('₹', '').replace(',', '').trim() : 0,
                    discountedPrice: discountedPriceElement ? discountedPriceElement.textContent.replace('₹', '').replace(',', '').trim() : 0,
                    itemLink: titleElement ? 'https://www.amazon.in' + titleElement.getAttribute('href') : null,
                    rating: ratingElement ? parseFloat(ratingElement.textContent.split(' ')[0]) : 0,
                    ratingCount: ratingCountElement ? parseInt(ratingCountElement.textContent.replace(/[^0-9]/g, '').replace(',', '')) : 0
                };
            });
        });
        
        resolve(products)
    } catch (error) {
        console.error('Error scraping data:', error);
        throw error
    } finally {
        await browser.close();
    }
})

// async function scrapeMyntra() {
const scrapeMyntra = (query) => new Promise(async resolve => {
    let q = replaceSpaces(query,'+')
    console.log({query: q})
    const url = `https://www.myntra.com/${q}`;
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-http2']
    });
    console.log('puppeteer launched')
    
    const page = await browser.newPage();
    console.log('Browser newpaged')
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    console.log('user agent set')

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('goto done')
        // await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        // console.log('screenshot clicked')
        await page.waitForSelector('.product-base');
        console.log('selector found')
        await autoScroll(page);
        console.log('scrolled page')
        await waitForImagesToLoad(page);

        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.product-base');
            return Array.from(productElements).map(el => {
                const imageElement = el.querySelector('img');
                const titleElement = el.querySelector('.product-product');
                const discountedPriceElement = el.querySelector('.product-discountedPrice') || el.querySelector('.product-price span');
                const originalPriceElement = el.querySelector('.product-strike');
                const ratingElement = el.querySelector('.product-ratingsContainer span');
                const ratingCountElement = el.querySelector('.product-ratingsCount');
                const itemLink = el.querySelector("a");

                return {
                    imageUrl: imageElement ? imageElement.src : null,
                    productTitle: titleElement ? titleElement.innerText : null,
                    price: originalPriceElement ? originalPriceElement.innerText.replace('Rs. ', '').replace(',', '') : 0,
                    discountedPrice: discountedPriceElement ? discountedPriceElement.innerText.replace('Rs. ', '').replace(',', '') : 0,
                    rating: ratingElement ? parseFloat(ratingElement.innerText) : 0,
                    // ratingCount: ratingCountElement ? parseFloat(ratingCountElement.childNodes[2].textContent.trim()) : null,
                    ratingCount: ratingCountElement ? parseFloat(ratingCountElement.childNodes[2].textContent.trim().replace('k', '').replace(',', '')) * (ratingCountElement.childNodes[2].textContent.includes('k') ? 1000 : 1) : 0,
                    itemLink: itemLink ? itemLink.href : null
                };
            });
        });

        resolve(products)
    } catch (error) {
        console.error('Error scraping data:', error);
        throw error
    } finally {
        await browser.close();
    }
})

const scrapeFlipkart = (query) => new Promise(async resolve => {
    let q = replaceSpaces(query,'+')
    console.log({query: q})
    const url = `https://www.flipkart.com/search?q=${q}`;
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-http2']
    });
    console.log('puppeteer launched')
    
    const page = await browser.newPage();
    console.log('Browser newpaged')
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    console.log('user agent set')

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('goto done')
        // await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        // console.log('screenshot clicked')
        await page.waitForSelector('[data-id]');
        console.log('selector found')
        // await autoScroll(page);
        // console.log('scrolled page')
        // await waitForImagesToLoad(page);

        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('div[data-id]');
            return Array.from(productElements).map(el => {
                const imageElement = el.querySelector('img'); // Check the correct selector
                const itemLink = el.querySelector('a'); // Corrected anchor link

                // Title (look for anchor with class 'wjcEIp' or the first 'a' tag)
                const titleElement = el.querySelector('a.wjcEIp') || el.querySelector('a');
                // const title = titleElement ? titleElement.innerText.trim() : "No title found";
                let title = el.querySelector('.KzDlHZ')?.textContent?.trim() ||
                            el.querySelector('.wjcEIp, .WKTcLC, a')?.textContent?.trim() || 
                            el.querySelector('.syl9yP')?.textContent?.trim() ||
                            el.querySelector('.wjcEIp, .WKTcLC, a[title]')?.getAttribute('title') || "0";

                // Discount price (look for div with class 'Nx9bqj' or similar classes)
                const discountPriceElement = el.querySelector('div.Nx9bqj');
                const discountPrice = discountPriceElement ? discountPriceElement.innerText.trim() : 0;

                // Original price (look for div with class 'yRaY8j' or similar classes)
                const originalPriceElement = el.querySelector('div.yRaY8j');
                const originalPrice = originalPriceElement ? originalPriceElement.innerText.trim() : 0;

                // Get Rating if available
                let rating = el.querySelector('.XQDdHH')?.textContent?.trim() || 0;

                // Get Rating Count if available
                let ratingCount = el.querySelector('.Wphh3N')?.textContent?.replace(/[()]/g, '').replace(',', '').trim() || 0;

                return {
                    imageUrl: imageElement ? imageElement.src : null,
                    productTitle: title ? title : null,
                    price: originalPrice ? originalPrice.replace('₹', '').replace(',', '') : 0,
                    discountedPrice: discountPrice ? discountPrice.replace('₹', '').replace(',', '') : 0,
                    itemLink: itemLink ? itemLink.href : null,
                    rating,
                    ratingCount
                };
            });
        });


        resolve(products)
    } catch (error) {
        console.error('Error scraping data:', error);
        throw error
    } finally {
        await browser.close();
    }
})

const scrapeAjio = (query) => new Promise(async resolve => {
    let q = replaceSpaces(query,'+')
    console.log({query: q})
    const url = `https://www.ajio.com/search/${q}`;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-http2']
    });
    console.log('puppeteer launched')
    
    const page = await browser.newPage();
    console.log('Browser newpaged')
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
    console.log('user agent set')

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('goto done')
        // await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        // console.log('screenshot clicked')
        await page.waitForSelector('.preview');
        console.log('selector found')
        await autoScroll(page);
        // console.log('scrolled page')
        // await waitForImagesToLoad(page);

        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('.preview');
            return Array.from(productElements).map(el => {
                const imageElement = el.querySelector('.imgHolder img');
                const brandElement = el.querySelector('.brand');
                const nameElement = el.querySelector('.nameCls');
                const ratingElement = el.querySelector('.contentHolder ._1gIWf p._3I65V');
                // const ratingCountElement = el.querySelector('.contentHolder ._1gIWf p:not(._3I65V)');
                const ratingCountElement = el.querySelector('._2mae- p:not(._3I65V)');
                const priceElement = el.querySelector('.price strong');
                const originalPriceElement = el.querySelector('.orginal-price');
                const discountedPriceElement = el.querySelector('.contentHolder ._305pl div strong span span');
        
                return {
                    imageUrl: imageElement ? imageElement.src : null,
                    productTitle: brandElement && nameElement ? brandElement.textContent.trim() + ' - ' + nameElement.textContent.trim() : null,
                    price: originalPriceElement ? originalPriceElement.textContent.replace('₹', '').replace(',', '').trim() : 0,
                    discountedPrice: priceElement ? priceElement.textContent.replace('₹', '').replace(',', '').trim() : 0,
                    itemLink: imageElement ? 'https://www.ajio.com' + imageElement.closest('a').getAttribute('href') : null,
                    rating: ratingElement ? parseFloat(ratingElement.textContent.trim()) : 0,
                    // ratingCount: ratingCountElement ? parseInt(ratingCountElement.textContent.replace(/[^\d]/g, '').replace(',', '')) : 0
                    ratingCount: ratingCountElement ? parseFloat(ratingCountElement.textContent.trim().replace('| ', '').replace('k', '').replace(',', '')) : 0
                };
            });
        });
        

        resolve(products)
    } catch (error) {
        console.error('Error scraping data:', error);
        throw error
    } finally {
        await browser.close();
    }
})

module.exports = {
    fetchProducts: async (payload) => {
        console.log({payload})
        const { query, site } = payload
        let items = []
        try {
            if (site === 'scpAMZN') {
                const response = await scrapeAmazon(query)
                items.push(...response)
                console.log("Amazon scraped \n")
            }
            if (site === 'scpFLPKT') {
                const response = await scrapeFlipkart(query)
                items.push(...response)
                console.log("Flipkart scraped \n")
            }
            if (site === 'scpMTRA') {
                const response = await scrapeMyntra(query)
                items.push(...response)
                console.log("Myntra scraped \n")
            }
            if (site === 'scpAJIO') {
                const response = await scrapeAjio(query)
                items.push(...response)
                console.log("Ajio scraped \n")
            }
            return { success: true, message: items };
        } catch(error) {
            return { success: false, message: error };
        }
    }
}