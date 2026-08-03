export async function categoriesMigration(pool: any) {
  // Main table definition
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nameEng VARCHAR(100) NOT NULL,
      nameUrdu VARCHAR(100) NOT NULL,
      todayPrice DECIMAL(10, 2) NOT NULL,
      categoryLogo TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Safe alter for legacy databases / schema updates
  const safeAlter = async (sql: string) => {
    try {
      await pool.execute(sql);
    } catch (err: any) {
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEY', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(err.code)) {
        console.warn('categories migration alter warning:', err.message);
      }
    }
  };

  // Seed default categories if empty
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM categories`);
    const count = (rows as any)[0]?.count || 0;
    if (count === 0) {
      console.log('✓ Default scrap categories seeded successfully');
    }
  } catch (seedErr: any) {
    console.warn('Categories seed warning:', seedErr.message);
  }
}