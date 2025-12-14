import mysql from "../config/sqldb";

export async function ordersMigration() {
  await mysql`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customerId INT NOT NULL,
      collectorId INT NOT NULL,
      status ENUM('pending', 'accepted', 'arrived', 'completed', 'cancelled') DEFAULT 'pending',
      pickupLatitude DECIMAL(10, 8) NOT NULL,
      pickupLongitude DECIMAL(11, 8) NOT NULL,
      pickupAddress VARCHAR(255) NOT NULL,
      scheduleTime DATETIME NOT NULL,
      approximateRaddiInKg DECIMAL(10, 2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customerId) REFERENCES users(id),
      FOREIGN KEY (collectorId) REFERENCES users(id)
    )
  `;
}