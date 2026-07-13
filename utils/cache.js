const cache = {};

module.exports = {
    get: (key) => {
        const item = cache[key];
        if (item && (item.expiry === 0 || item.expiry > Date.now())) {
            return item.data;
        }
        // Jika sudah tamat tempoh, kita boleh buang dari memori
        if (item && item.expiry > 0 && item.expiry <= Date.now()) {
            delete cache[key];
        }
        return null;
    },
    set: (key, data, ttlSeconds = 300) => {
        cache[key] = {
            data: data,
            expiry: ttlSeconds === 0 ? 0 : Date.now() + (ttlSeconds * 1000)
        };
    },
    del: (key) => {
        if (cache[key]) {
            delete cache[key];
            console.log(`[CACHE] Memadam kunci cache: ${key}`);
        }
    },
    clear: () => {
        for (let key in cache) {
            delete cache[key];
        }
        console.log('[CACHE] Semua cache dikosongkan.');
    }
};
