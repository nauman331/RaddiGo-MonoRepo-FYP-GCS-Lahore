import mysql from "../auth-service/sqldb";

export async function categoriesMigration() {
  await mysql`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nameEng VARCHAR(100) NOT NULL,
      nameUrdu VARCHAR(100) NOT NULL,
      todayPrice DECIMAL(10, 2) NOT NULL,
      categoryLogo VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
}