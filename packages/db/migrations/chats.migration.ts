export async function chatsMigration(pool: any) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL COMMENT 'Chat is scoped to a specific order',
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_chats_order_id ON chats(order_id)`);
    await pool.execute(`CREATE INDEX IF NOT EXISTS idx_chats_sender ON chats(sender_id)`);
  } catch {
    // Indexes may already exist
  }
}
