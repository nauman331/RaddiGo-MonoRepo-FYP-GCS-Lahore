export async function orderBidsMigration(pool: any) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_bids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      collector_id INT NOT NULL,
      bid_amount DECIMAL(18, 2) NOT NULL COMMENT 'Collector offered price (PKR)',
      counter_amount DECIMAL(18, 2) DEFAULT NULL COMMENT 'Customer counter offer (PKR)',
      status ENUM('pending', 'accepted', 'rejected', 'countered') NOT NULL DEFAULT 'pending',
      round INT NOT NULL DEFAULT 1 COMMENT 'Negotiation round number',
      note VARCHAR(255) DEFAULT NULL COMMENT 'Optional note from bidder',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Index for fast lookup of bids per order
  try {
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_order_bids_order_id ON order_bids(order_id)`);
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_order_bids_collector ON order_bids(collector_id, status)`);
  } catch {
    // Indexes may already exist
  }
}
