const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const queries = [
    { name: 'asthma', q: 'asthma inhaler medical' },
    { name: 'copd', q: 'oxygen mask medical patient' },
    { name: 'tb', q: 'chest xray lungs doctor' },
    { name: 'respiratory-infections', q: 'doctor stethoscope patient chest' },
    { name: 'cystic-fibrosis', q: 'nebulizer medical treatment' },
    { name: 'lung-cancer', q: 'ct scan hospital' },
    { name: 'sleep-apnea', q: 'cpap mask sleep' },
    { name: 'delivery', q: 'newborn baby hospital mother' },
    { name: 'c-section', q: 'surgery hospital room' },
    { name: 'prenatal-care', q: 'pregnant ultrasound doctor' },
    { name: 'infertility', q: 'couple consulting doctor clinic' },
    { name: 'gynecology', q: 'female doctor patient clinic' },
    { name: 'womens-wellness', q: 'woman blood pressure hospital' }
];

async function download(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    for (const item of queries) {
        console.log(`Searching Unsplash for: ${item.q}...`);
        try {
            await page.goto(`https://unsplash.com/s/photos/${encodeURIComponent(item.q)}`, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Wait for image results
            await page.waitForSelector('img[data-test="photo-grid-masonry-img"]', { timeout: 10000 });
            
            // Get the first high-res image
            const imgUrl = await page.evaluate(() => {
                const img = document.querySelector('img[data-test="photo-grid-masonry-img"]');
                return img ? img.src : null;
            });

            if (imgUrl) {
                // Unsplash URLs usually have ?w=... parameter. Let's get a bigger version.
                const highResUrl = imgUrl.split('?')[0] + '?w=800&q=80&fm=jpg&crop=entropy&cs=tinysrgb';
                const filepath = path.join(__dirname, '..', 'images', `${item.name}.png`);
                console.log(`Downloading ${highResUrl} to ${filepath}`);
                await download(highResUrl, filepath);
            } else {
                console.log(`No image found for ${item.q}`);
            }
        } catch (e) {
            console.error(`Failed to process ${item.q}: ${e.message}`);
        }
    }
    
    await browser.close();
    console.log('Done!');
})();
