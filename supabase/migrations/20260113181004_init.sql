create type staff_position as enum (
    'hangtechnikus',
    'fenytechnikus',
    'stage',
    'szervezo',
    'egyeb'
);

create type role_view as enum (
    'equipment',
    'programs',
    'staff',
    'task',
    'chat',
    'settings'
);

create table role (
    id serial,
    name varchar(255),
    color varchar(255),
    add role_view array,
    read role_view array,
    update role_view array,
    delete role_view array,

    primary key (id)
);

create table staff (
    id uuid not null references auth.users on delete cascade,
    name varchar(255),
    mention_name varchar(255),
    postition staff_position,
    role integer references role,

    primary key (id)
);


create type program_state as enum (
    'varakozo',
    'tervezes',
    'proba_alatt',
    'veglegesites',
    'lemondva',
    'lezarva'
);

create table program (
    id serial,
    date timestamp with time zone,
    location varchar(255),
    description text,
    status program_state,
    leader uuid references public.staff,
    foh_list text,
    stage_list text,
    other_list text,

    primary key (id)
);

create type crew_position as enum (
    'Stage',
    'hangtechnikus',
    'fenytechnikus',
    'fotos',
    'videos',
    'vetito'
);

create table crew_member (
    id serial,
    staff uuid not null references public.staff,
    program integer not null references public.program,
    role crew_position,

    primary key (id)
);

create table program_file (
    id serial,
    program integer references public.program,
    file uuid references storage.objects,

    primary key (id, program, file)
);

create table rehearsal (
    id serial,
    program integer references public.program,
    lesson_period text,
    notes text,

    primary key (id, program)
);

create type task_type as enum (
    'sound',
    'light'
);

create type task_priority as enum (
    'alacsony',
    'kozepes',
    'magas'
);

create type task_status as enum (
    'teendo',
    'folyamatban',
    'kesz'
);

create table task (
    id serial,
    program integer references public.program,
    type task_type,
    assigned_to uuid references public.staff,
    priority task_priority,
    status task_status,
    details text,

    primary key (id)
);

create table chat_message (
    id serial,
    message text,
    sender uuid not null references auth.users,
    deleted bool,

    primary key (id)
);

create table chat_mentions (
    id serial,
    message int not null references public.chat_message,
    mentioned uuid references public.staff,

    primary key (id)
);

create type equipment_category as enum (
    'hangtechnika',
    'fenytechnika',
    'szinpad',
    'kabel',
    'egyeb'
);

--- loan: kölcsönzés (program or else)
-- loan_entry: egy kölcsönzött item
-- item: az egyes eszközök
-- type: az eszközök típusai (termék)
create table equipment_type (
    id serial,
    name varchar(255) not null,
    category equipment_category,
    description text,

    primary key (id)
);

create type equipment_status as enum (
    'elerheto',
    'karbantartas',
    'selejt'
);

create table equipment_item (
    id serial,
    type integer not null references public.equipment_type,
    serial varchar(255) not null,
    status equipment_status not null,
    notes text,

    primary key (id, type)
);

create type equipment_inventory as enum (
    'foh',
    'stage',
    'egyeb',
    'external'
);

create type loan_status as enum (
    'aktiv',
    'lezart'
);

create table equipment_loan (
    id serial,
    start_date timestamp with time zone,
    expected_return_date timestamp with time zone,
    return_date timestamp with time zone,
    inventory equipment_inventory,
    status loan_status,
    taken_by jsonb,

    primary key(id)
);

create table equipment_loan_item (
    id serial,
    loan integer not null,
    item integer not null,

    primary key (id, loan, item)
);
