import pool from './packages/db/index';

async function main() {
    try {
        const [rows] = await pool.query('DESCRIBE categories');
        console.log(rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main();
