export async function walletMigration(pool: any) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('deposit', 'withdrawal') NOT NULL,
      amount DECIMAL(18,2) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      admin_id INT NULL,
      note TEXT NULL,
      sender_account VARCHAR(50) NULL COMMENT 'Deposit: user account number',
      transaction_id VARCHAR(100) NULL COMMENT 'Deposit: TID from SMS',
      bank_name VARCHAR(100) NULL COMMENT 'Withdrawal: bank/wallet name',
      account_no VARCHAR(50) NULL COMMENT 'Withdrawal: account number',
      account_title VARCHAR(100) NULL COMMENT 'Withdrawal: account holder name',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}