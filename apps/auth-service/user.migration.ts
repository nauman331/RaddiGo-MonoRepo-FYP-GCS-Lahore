import mysql from "../../packages/config/sqldb";

export async function userMigration() {
  await mysql`
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
      role ENUM('customer', 'admin', 'support', 'collector') DEFAULT 'customer',
      isVerified BOOLEAN DEFAULT FALSE,
      otp VARCHAR(6),
      otpExpiry DATETIME,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
}