-- Add date column to rehearsal (used for timeline and ordering)
alter table rehearsal add column if not exists date timestamp with time zone;
