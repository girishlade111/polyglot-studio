/*
  # Create code files table for user authentication system

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `code_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `code_content` (text)
      - `language` (enum: html, css, javascript)
      - `title` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access only their own data
    - Add indexes for performance

  3. Relationships
    - Foreign key constraint between code_files.user_id and users.id
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create language enum
CREATE TYPE code_language AS ENUM ('html', 'css', 'javascript');

-- Create code_files table
CREATE TABLE IF NOT EXISTS code_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  code_content text NOT NULL DEFAULT '',
  language code_language NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_files ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Code files policies
CREATE POLICY "Users can view own code files"
  ON code_files
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own code files"
  ON code_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own code files"
  ON code_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own code files"
  ON code_files
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_code_files_user_id ON code_files(user_id);
CREATE INDEX IF NOT EXISTS idx_code_files_language ON code_files(language);
CREATE INDEX IF NOT EXISTS idx_code_files_created_at ON code_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to automatically create user record on auth signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user creation
CREATE OR REPLACE TRIGGER on_auth_user_created_users
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();