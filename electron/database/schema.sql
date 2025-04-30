CREATE TABLE IF NOT EXISTS file_orders (
  file_path text primary key,
  parent_path text,
  order_index integer
);

CREATE TABLE IF NOT EXISTS quiz (
  id integer primary key,
  title text not null,
  created_at timestamp default current_timestamp
);

CREATE TABLE IF NOT EXISTS questions (
  id integer primary key,
  quiz_id integer not null,
  text text not null,
  type text not null check (
    type in (
      'multiple-choice',
      'fill-in-blank',
      'true-false',
      'short-answer'
    )
  ),
  correct_answer boolean default null,
  scheduled boolean default false,
  foreign key (quiz_id) references quiz (id)
);

CREATE TABLE IF NOT EXISTS options (
  id integer primary key,
  question_id integer not null,
  text text not null,
  is_correct boolean not null,
  foreign key (question_id) references questions (id)
);

CREATE TABLE IF NOT EXISTS answers (
  answer_id integer primary key,
  question_id integer not null,
  text text not null,
  foreign key (question_id) references questions (id)
);

CREATE TABLE IF NOT EXISTS quiz_review (
  id integer primary key,
  quiz_id integer not null,
  correct_questions text,
  wrong_questions text,
  score integer,
  created_at timestamp default current_timestamp,
  foreign key (quiz_id) references quiz (id)
);

CREATE TABLE IF NOT EXISTS decks (id integer primary key, title text not null);

CREATE TABLE IF NOT EXISTS cards (
  id integer primary key,
  deck_id integer not null,
  front text not null,
  back text not null,
  foreign key (deck_id) references decks (id)
);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards (deck_id);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions (quiz_id);

CREATE INDEX IF NOT EXISTS idx_options_question_id ON options (question_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers (question_id);
