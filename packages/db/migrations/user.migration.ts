export async function userMigration(pool: any) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address VARCHAR(255),
      googleId VARCHAR(100),
      facebookId VARCHAR(100),
      profilePicture VARCHAR(255),
      fcmToken VARCHAR(512) DEFAULT NULL COMMENT 'Firebase Cloud Messaging device token',
      role ENUM('customer', 'admin', 'support', 'collector') DEFAULT 'customer',
      isActive BOOLEAN DEFAULT TRUE,
      isVerified BOOLEAN DEFAULT FALSE,
      otp VARCHAR(6),
      otpExpiry DATETIME,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Safe ALTER for existing databases — MySQL 8 doesn't support
  // IF NOT EXISTS in ALTER TABLE, so we catch ER_DUP_FIELDNAME errors
  const safeAlter = async (sql: string) => {
    try { await pool.execute(sql); } catch (err: any) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn('user migration alter warning:', err.message);
      }
    }
  };
  await safeAlter(`ALTER TABLE users ADD COLUMN fcmToken VARCHAR(512) DEFAULT NULL COMMENT 'Firebase Cloud Messaging device token'`);
}