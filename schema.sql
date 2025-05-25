-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  hex_code VARCHAR(7) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_hex VARCHAR(7) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_hex) REFERENCES users(hex_code)
);

-- Create index for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
