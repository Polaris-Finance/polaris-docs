-- Per-visitor request log for the hourly and daily limits (visitor = salted IP hash).
CREATE TABLE IF NOT EXISTS hits (
  visitor TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hits_visitor_ts ON hits (visitor, ts);

-- Anonymous question log: what people ask and what the guide answered.
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  page TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  stop_reason TEXT
);
CREATE INDEX IF NOT EXISTS questions_ts ON questions (ts);
