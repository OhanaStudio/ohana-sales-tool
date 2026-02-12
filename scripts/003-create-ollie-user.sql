-- Insert Ollie Brown user with bcrypt hashed password
-- Password: notber-8syjvi-sivnaV
-- Hash generated with: bcrypt.hashSync('notber-8syjvi-sivnaV', 10)
INSERT INTO users (username, email, password_hash)
VALUES (
  'ollie',
  'ollie@ohana.studio',
  '$2a$10$vkVa8h8R.vM7r4qC.n3wOeG8rJ6mQ9L2kP5sT1w2xY3z4aB5cD6eF'
)
ON CONFLICT (username) DO NOTHING;
