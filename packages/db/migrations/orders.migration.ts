export async function ordersMigration(pool: any) {
  const safeAlter = async (sql: string) => {
    try { await pool.execute(sql); } catch (err: any) {
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEY', 'ER_FK_DUP_NAME', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(err.code)) {
        console.warn(`orders migration warning: ${err.message}`);
      }
    }
  };

  // Main orders table — extended with bidding + category fields
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customerId INT NOT NULL,
      collectorId INT DEFAULT NULL,
      categoryId INT DEFAULT NULL,
      status ENUM('pending','bidding','accepted','in_progress','completed','cancelled') DEFAULT 'pending',
      pickupLatitude DECIMAL(10, 8) NOT NULL,
      pickupLongitude DECIMAL(11, 8) NOT NULL,
      pickupAddress VARCHAR(255) NOT NULL,
      scheduleTime DATETIME NOT NULL,
      approximateRaddiInKg DECIMAL(10, 2) NOT NULL,
      expectedPrice DECIMAL(18, 2) DEFAULT NULL COMMENT 'Customer hint price (PKR)',
      finalPrice DECIMAL(18, 2) DEFAULT NULL COMMENT 'Agreed bid price after negotiation',
      cancelReason VARCHAR(255) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES users(id),
      FOREIGN KEY (collectorId) REFERENCES users(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Safe upgrade for existing databases — catch ER_DUP_FIELDNAME instead of IF NOT EXISTS
  await safeAlter(`ALTER TABLE orders ADD COLUMN categoryId INT DEFAULT NULL AFTER collectorId`);
  await safeAlter(`ALTER TABLE orders ADD COLUMN expectedPrice DECIMAL(18,2) DEFAULT NULL AFTER approximateRaddiInKg`);
  await safeAlter(`ALTER TABLE orders ADD COLUMN finalPrice DECIMAL(18,2) DEFAULT NULL AFTER expectedPrice`);
  await safeAlter(`ALTER TABLE orders ADD COLUMN cancelReason VARCHAR(255) DEFAULT NULL AFTER finalPrice`);
  // Expand status enum
  await safeAlter(`ALTER TABLE orders MODIFY COLUMN status ENUM('pending','bidding','accepted','in_progress','completed','cancelled') DEFAULT 'pending'`);
  // Add FK if not present
  await safeAlter(`ALTER TABLE orders ADD CONSTRAINT fk_orders_category FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL`);
}