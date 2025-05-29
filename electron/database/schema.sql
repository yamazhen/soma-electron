-- for file orders in the note explorer
CREATE TABLE IF NOT EXISTS file_orders (
  file_path text primary key,
  parent_path text,
  order_index integer
);

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
