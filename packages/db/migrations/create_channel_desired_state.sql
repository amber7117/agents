-- 创建 channel_desired_state 表
CREATE TABLE IF NOT EXISTS channel_desired_state (
    channel_id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    should_run BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_channel_desired_state_should_run 
ON channel_desired_state(should_run);

-- 显示表结构
\d channel_desired_state;
