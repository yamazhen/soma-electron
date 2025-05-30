-- for file orders in the note explorer
CREATE TABLE IF NOT EXISTS file_orders (
  file_path text primary key,
  parent_path text,
  order_index integer
);

CREATE TABLE IF NOT EXISTS note_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  target_note_name TEXT NOT NULL,
  target_path TEXT,
  link_text TEXT NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links (source_path);

CREATE INDEX IF NOT EXISTS idx_note_links_target_name ON note_links (target_note_name);

CREATE INDEX IF NOT EXISTS idx_note_links_target_path ON note_links (target_path);

CREATE TABLE IF NOT EXISTS note_metadata (
  path TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_note_metadata_name ON note_metadata (name);

/*
 * QUIZ SCHEMA 
 * QUIZ SCHEMA
 * QUIZ SCHEMA
 */
CREATE TABLE IF NOT EXISTS quiz (
  id integer primary key,
  title text not null,
  created_at timestamp default current_timestamp
);

-- quiz questions
CREATE TABLE IF NOT EXISTS questions (
  id integer primary key,
  quiz_id integer not null,
  text text not null,
  type text not null check (
    type in ('multiple-choice', 'text-answer', 'true-false')
  ),
  -- for true or false questions
  boolean_answer boolean default null,
  scheduled boolean default false,
  next_review_date text default null,
  review_interval integer default 1,
  ease_factor real default 2.5,
  consecutive_correct integer default 0,
  last_reviewed text default null,
  foreign key (quiz_id) references quiz (id)
);

-- for multiple-choice questions
CREATE TABLE IF NOT EXISTS options (
  id integer primary key,
  question_id integer not null,
  text text not null,
  is_correct boolean not null,
  foreign key (question_id) references questions (id) on delete cascade
);

-- for text answer questions
CREATE TABLE IF NOT EXISTS answers (
  id integer primary key,
  question_id integer not null,
  text text not null,
  foreign key (question_id) references questions (id) on delete cascade
);

-- for storing quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id integer primary key,
  quiz_id integer not null,
  score integer not null,
  total_questions integer not null,
  percentage float generated always as (
    case
      when total_questions > 0 then (score * 100.0 / total_questions)
      else 0
    end
  ) stored,
  created_at timestamp default current_timestamp,
  foreign key (quiz_id) references quiz (id)
);

-- for storing individual question responses
CREATE TABLE IF NOT EXISTS question_responses (
  id integer primary key,
  attempt_id integer not null,
  question_id integer not null,
  user_answer text not null,
  is_correct boolean not null,
  foreign key (attempt_id) references quiz_attempts (id) on delete cascade,
  foreign key (question_id) references questions (id) on delete cascade
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts (created_at);

CREATE INDEX IF NOT EXISTS idx_question_responses_correct ON question_responses (is_correct);

CREATE INDEX IF NOT EXISTS idx_questions_next_review ON questions (next_review_date);

CREATE INDEX IF NOT EXISTS idx_questions_scheduled_review ON questions (scheduled, next_review_date);

/* 
* FLASHCARD SCHEMA 
* FLASHCARD SCHEMA
* FLASHCARD SCHEMA
*/
CREATE TABLE IF NOT EXISTS decks (id integer primary key, title text not null);

CREATE TABLE IF NOT EXISTS cards (
  id integer primary key,
  deck_id integer not null,
  front text not null,
  back text not null,
  foreign key (deck_id) references decks (id)
);

CREATE TABLE IF NOT EXISTS users (
  id integer primary key check (id = 1),
  username text,
  display_name text,
  email text,
  profile_picture text,
  -- i can expand this later to include settings
  -- the fields under here are not in the backend
  last_opened timestamp default current_timestamp,
  study_streak integer default 0,
  last_sync_timestamp timestamp default null
);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards (deck_id);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions (quiz_id);

CREATE INDEX IF NOT EXISTS idx_options_question_id ON options (question_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers (question_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (
    type IN ('note', 'note-edit', 'quiz', 'flashcard')
  ),
  title TEXT NOT NULL,
  subtitle TEXT,
  entity_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log (timestamp DESC);
