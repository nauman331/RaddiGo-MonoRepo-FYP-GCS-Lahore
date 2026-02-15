import fs from 'fs';

function loadEnvFromRoot() {
    try {
        const envUrl = new URL('../../.env', import.meta.url);
        const envPath = envUrl.pathname;
        if (!fs.existsSync(envPath)) return;
        const raw = fs.readFileSync(envPath, { encoding: 'utf8' });
        raw.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const match = trimmed.match(/^([A-Za-z0-9_\.-]+)\s*=\s*(.*)$/);
            if (!match) return;
            let [, key, val] = match;
            if (!val) val = '';
            val = val.trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            val = val.replace(/\\n/g, '\n');
            if (process.env[key] === undefined) process.env[key] = val;
        });
    } catch (err) {
        // non-fatal; services should still run if env isn't present
        console.warn('loadEnv: could not load .env from repo root', err?.message || err);
    }
}

loadEnvFromRoot();

export { };
