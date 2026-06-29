const fs = require('fs');
const path = require('path');
const https = require('https');

const queries = [
    { name: 'asthma', q: 'asthma inhaler' },
    { name: 'copd', q: 'nasal cannula oxygen' },
    { name: 'tb', q: 'chest x-ray lungs' },
    { name: 'respiratory-infections', q: 'doctor stethoscope chest' },
    { name: 'cystic-fibrosis', q: 'nebulizer mask' },
    { name: 'lung-cancer', q: 'CT scan machine' },
    { name: 'sleep-apnea', q: 'cpap machine' },
    { name: 'delivery', q: 'newborn baby hospital' },
    { name: 'c-section', q: 'cesarean section' },
    { name: 'prenatal-care', q: 'pregnancy ultrasound' },
    { name: 'infertility', q: 'fertility clinic' },
    { name: 'gynecology', q: 'gynecologist' },
    { name: 'womens-wellness', q: 'blood pressure test' }
];

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Bot' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function download(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Bot' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, filepath).then(resolve).catch(reject);
            }
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                   .on('error', reject)
                   .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Status: ${res.statusCode}`));
            }
        });
    });
}

(async () => {
    for (const item of queries) {
        console.log(`Searching Wikimedia for: ${item.q}`);
        try {
            const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(item.q)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`;
            const data = await fetchJson(searchUrl);
            const pages = data?.query?.pages;
            if (pages) {
                const page = Object.values(pages)[0];
                if (page && page.imageinfo && page.imageinfo[0]) {
                    const imgUrl = page.imageinfo[0].url;
                    const filepath = path.join(__dirname, '..', 'images', `${item.name}.png`);
                    console.log(`Downloading ${imgUrl} to ${filepath}`);
                    await download(imgUrl, filepath);
                    continue;
                }
            }
            console.log(`No image found for ${item.q}`);
        } catch (e) {
            console.error(`Failed ${item.q}:`, e.message);
        }
    }
    console.log('Done downloading Wiki images!');
})();
