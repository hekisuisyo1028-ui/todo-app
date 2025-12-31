-- =============================================
-- TODOリスト アプリケーション データベーススキーマ
-- =============================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- テーブル定義
-- =============================================

-- カテゴリテーブル
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  memo TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  is_completed BOOLEAN DEFAULT FALSE,
  task_date DATE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  routine_id UUID REFERENCES routines(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ルーティンテーブル
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  memo TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  has_time BOOLEAN DEFAULT FALSE,
  time TIME,
  days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- インデックス
-- =============================================

-- カテゴリ
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- タスク
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_routine ON tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- ルーティン
CREATE INDEX IF NOT EXISTS idx_routines_user ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_active ON routines(is_active);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- RLSを有効化
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- カテゴリのポリシー
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- タスクのポリシー
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ルーティンのポリシー
CREATE POLICY "Users can view own routines" ON routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines" ON routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" ON routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" ON routines
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 関数
-- =============================================

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 未完了タスク繰り越し関数（ルーティンタスクは除外）
-- =============================================

CREATE OR REPLACE FUNCTION carry_over_incomplete_tasks(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tasks
  SET 
    task_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE 
    user_id = target_user_id
    AND task_date < CURRENT_DATE 
    AND is_completed = FALSE
    AND routine_id IS NULL;  -- ルーティンタスクは繰り越さない
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 既存データへのマイグレーション（routine_idカラム追加）
-- =============================================

-- 既存のtasksテーブルにroutine_idカラムがない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'routine_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN routine_id UUID REFERENCES routines(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_tasks_routine ON tasks(routine_id);
  END IF;
END $$;

-- 既存のroutinesテーブルにpriorityカラムがない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routines' AND column_name = 'priority'
  ) THEN
    ALTER TABLE routines ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
  END IF;
END $$;

-- 既存のroutinesテーブルにdays_of_weekカラムがない場合は追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routines' AND column_name = 'days_of_week'
  ) THEN
    ALTER TABLE routines ADD COLUMN days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[];
  END IF;
END $$;
