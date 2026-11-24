-- Score duplicate checks at intake on a labeled set. Scratch tables only.
\set ON_ERROR_STOP on
set search_path = public, extensions;
drop table if exists dup_players, dup_queries, dup_nick;
create table dup_players (id int primary key, first text, last text, suffix text, sport text, school text, hs text, state text);
create table dup_queries (qid int primary key, first text, last text, suffix text, sport text, school text, hs text, kind text, label text);
\copy dup_players from 'players.csv' csv header
\copy dup_queries from 'queries.csv' csv header

create or replace function dup_norm(variadic parts text[]) returns text language sql immutable as $$
  select trim(regexp_replace(lower(array_to_string(parts, ' ')), '[^a-z0-9]+', ' ', 'g'))
$$;

alter table dup_players add column name_search text, add column last_search text, add column first_initial text;
update dup_players set name_search = dup_norm(first, last, coalesce(suffix, '')),
  last_search = dup_norm(last), first_initial = left(dup_norm(first), 1);
create index on dup_players using gin (name_search gin_trgm_ops);
create index on dup_players using gin (last_search gin_trgm_ops);
analyze dup_players;

create table dup_nick (a text, b text);
insert into dup_nick values ('michael','mike'),('christopher','chris'),('jonathan','jon'),('joshua','josh'),
 ('matthew','matt'),('nicholas','nick'),('anthony','tony'),('william','will'),('robert','rob'),('daniel','dan'),
 ('benjamin','ben'),('zachary','zach'),('joseph','joe'),('samuel','sam'),('alexander','alex'),('jacob','jake'),
 ('timothy','tim'),('thomas','tom'),('andrew','drew'),('jeremiah','jay'),('nathaniel','nate'),('cameron','cam'),
 ('dominic','dom'),('isaiah','zay'),('kenneth','kenny'),('gregory','greg'),('edward','eddie'),('richard','rich');
insert into dup_nick select b, a from dup_nick;

-- S0: today's check. Trigram % on the full name, top 8 by similarity.
create temp table s0 as
select q.qid, m.id, m.sim, m.rn from dup_queries q
cross join lateral (
  select p.id, similarity(p.name_search, dup_norm(q.first, q.last)) sim,
         row_number() over (order by similarity(p.name_search, dup_norm(q.first, q.last)) desc, p.id) rn
  from dup_players p where p.name_search % dup_norm(q.first, q.last)
  order by sim desc, p.id limit 8) m;

-- S1: S0 plus the other form of a nickname.
create temp table s1 as
select qid, id, max(sim) sim, row_number() over (partition by qid order by max(sim) desc, id) rn from (
  select * from s0
  union all
  select q.qid, m.id, m.sim, 0 from dup_queries q
  join dup_nick n on n.a = dup_norm(q.first)
  cross join lateral (
    select p.id, similarity(p.name_search, dup_norm(n.b, q.last)) sim
    from dup_players p where p.name_search % dup_norm(n.b, q.last)
    order by sim desc, p.id limit 8) m
) u group by qid, id;
delete from s1 where rn > 8;

-- S2: S0's candidates, shown only when the name is close or the context agrees.
create temp table s2 as
select s.qid, s.id, s.sim, row_number() over (partition by s.qid order by
    s.sim + 0.15 * (p.sport = q.sport)::int + 0.15 * (p.school = q.school)::int + 0.1 * (p.hs = q.hs)::int desc, s.id) rn
from s0 s join dup_players p on p.id = s.id join dup_queries q on q.qid = s.qid
where s.sim >= 0.5 or (p.sport = q.sport and (p.school = q.school or p.hs = q.hs));

-- S3: last-name trigram plus the same first initial.
create temp table s3 as
select q.qid, m.id, m.sim, m.rn from dup_queries q
cross join lateral (
  select p.id, similarity(p.name_search, dup_norm(q.first, q.last)) sim,
         row_number() over (order by similarity(p.name_search, dup_norm(q.first, q.last)) desc, p.id) rn
  from dup_players p
  where p.last_search % dup_norm(q.last) and p.first_initial = left(dup_norm(q.first), 1)
  order by sim desc, p.id limit 8) m;

create temp table scores (strategy text, kind text, n int, found int, first int, shown_any int, avg_shown numeric);
\set report 'insert into scores select :''name'', q.kind, count(*), count(*) filter (where exists (select 1 from :name s where s.qid = q.qid and s.id::text = q.label)), count(*) filter (where exists (select 1 from :name s where s.qid = q.qid and s.rn = 1 and s.id::text = q.label)), count(*) filter (where exists (select 1 from :name s where s.qid = q.qid)), round(avg((select count(*) from :name s where s.qid = q.qid)), 2) from dup_queries q group by q.kind;'
\set name s0
:report
\set name s1
:report
\set name s2
:report
\set name s3
:report

\echo '== duplicates found in the list (recall@8) and ranked first, by kind of re-entry'
select strategy, kind, n, found, first from scores where kind <> 'new' order by kind, strategy;
\echo '== totals'
select strategy,
  sum(found) filter (where kind <> 'new') || '/' || sum(n) filter (where kind <> 'new') as dups_found,
  sum(first) filter (where kind <> 'new') as dups_ranked_first,
  sum(shown_any) filter (where kind = 'new') || '/' || sum(n) filter (where kind = 'new') as new_players_warned,
  max(avg_shown) filter (where kind = 'new') as avg_list_for_new
from scores group by strategy order by strategy;
