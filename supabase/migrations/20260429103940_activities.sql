create type activity_type as enum ('proba', 'megbeszeles', 'epites', 'bontas');

create table activitiy (
    id serial,
    type activity_type not null default 'proba',
    program integer references public.program,
    lesson_period text,
    notes text
);

insert into activitiy (id, type, program, lesson_period, notes)
select id, 'proba'::activity_type, program, lesson_period, notes from rehearsal;

drop table rehearsal;
