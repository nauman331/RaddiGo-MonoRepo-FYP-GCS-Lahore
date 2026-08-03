export async function categoriesMigration(pool: any) {
  // Main table definition
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nameEng VARCHAR(100) NOT NULL,
      nameUrdu VARCHAR(100) NOT NULL,
      todayPrice DECIMAL(10, 2) NOT NULL,
      categoryLogo VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Safe alter for legacy databases (if table existed with old column names)
  const safeAlter = async (sql: string) => {
    try {
      await pool.execute(sql);
    } catch (err: any) {
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEY', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(err.code)) {
        console.warn('categories migration alter warning:', err.message);
      }
    }
  };

  await safeAlter(`ALTER TABLE categories ADD COLUMN nameEng VARCHAR(100) NOT NULL DEFAULT 'Scrap'`);
  await safeAlter(`ALTER TABLE categories ADD COLUMN nameUrdu VARCHAR(100) NOT NULL DEFAULT 'سکریپ'`);
  await safeAlter(`ALTER TABLE categories ADD COLUMN todayPrice DECIMAL(10, 2) NOT NULL DEFAULT 50.00`);
  await safeAlter(`ALTER TABLE categories ADD COLUMN categoryLogo VARCHAR(255) DEFAULT NULL`);

  // Seed default categories if empty
  try {
    const [rows] = await pool.query(`SELECT COUNT(*) as count FROM categories`);
    const count = (rows as any)[0]?.count || 0;
    if (count === 0) {
      await pool.execute(`
        INSERT INTO categories (nameEng, nameUrdu, todayPrice) VALUES
        ('Paper & Cardboard', 'کاغذ اور گتا', 45.00),
        ('Plastic Scrap', 'پلاسٹک', 60.00),
        ('Iron & Steel', 'لوہا', 120.00),
        ('Copper & Brass', 'تانبا اور پیتل', 1800.00)
      `);
      console.log('✓ Default scrap categories seeded successfully');
    }
  } catch (seedErr: any) {
    console.warn('Categories seed warning:', seedErr.message);
  }
}