-- Synthetic transfer portal data at portal-season scale, for query plans only.
-- Run against redshirt_perf (a copy of the local schema). psql -v n=20000
\set ON_ERROR_STOP on
begin;
truncate published_wire_events, published_players, recruitment_events, recruitments,
  player_enrollments, player_sports, player_audit_log, player_duplicate_dismissals,
  player_submissions, player_external_ids, players restart identity cascade;

create temp table names_first(i int, v text);
insert into names_first select row_number() over () - 1, v from unnest(array[
 'James','John','Michael','David','Chris','Jaden','Jalen','Jordan','Tyler','Brandon','Marcus','Darius','Isaiah','Elijah','Caleb','Josiah','Malik','Jamal','Xavier','Cameron',
 'Devin','Trey','Tre','DeAndre','Andre','Anthony','Aaron','Justin','Kevin','Kyle','Bryce','Bryson','Carson','Cooper','Dylan','Ethan','Gavin','Hunter','Jace','Jayden',
 'Keon','Kobe','Lamar','Mason','Nate','Nick','Omar','Quinn','Reggie','Ryan','Sam','Shane','Terrell','Travis','Tyrese','Zach','Zion','Avery','Taylor','Morgan']) v;
create temp table names_last(i int, v text);
insert into names_last select row_number() over () - 1, v from unnest(array[
 'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis',
 'Robinson','Walker','Young','Allen','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell','Mitchell','Roberts','Carter','Phillips','Evans','Turner','Parker',
 'Collins','Edwards','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Cooper','Peterson','Reed','Bailey','Bell','Gomez','Kelly','Howard','Ward','Cox','Diaz','Richardson',
 'Wood','Watson','Brooks','Bennett','Gray','James','Reyes','Hughes','Price','Myers','Long','Foster','Sanders','Ross','Powell','Sullivan','Russell','Ortiz','Jenkins','Perry']) v;
create temp table sch as select row_number() over (order by id) - 1 i, id from schools;
create temp table sp as select row_number() over (order by slug) - 1 i, id, slug from sports;

insert into players (id, first_name, last_name, slug, name_search, hometown_state, high_school_name, hs_grad_year, created_at, updated_at)
overriding system value
select g, f.v, l.v, lower(f.v||'-'||l.v), lower(f.v||' '||l.v), 'TX', 'High School '||(g % 900), 2019 + (g % 6),
  now() - (g % 700) * interval '1 day', now()
from generate_series(1, :n) g
join names_first f on f.i = (hashint4(g) & 2147483647) % 60
join names_last l on l.i = (hashint4(g * 7) & 2147483647) % 80;

insert into player_sports (id, player_id, sport_id, position, height_in, weight_lb)
overriding system value
select g, g, (select id from sp where i = case when g % 10 < 5 then 0 when g % 10 < 8 then 1 else 2 end order by i limit 1),
  (array['QB','RB','WR','TE','OL','DL','LB','CB','S','G','F','C'])[1 + g % 12], 66 + g % 18, 170 + g % 140
from generate_series(1, :n) g;

-- One recruitment per player sport. Status mix: 40% entered, 35% committed, 15% enrolled, 10% withdrawn.
insert into recruitments (id, player_sport_id, kind, cycle_year, origin_school_id, status, status_at, entered_at,
  destination_school_id, closed_at, is_grad_transfer)
overriding system value
select g, g, 'transfer', 2024 + g % 3,
  (select id from sch where i = (hashint4(g) & 2147483647) % (select count(*) from sch)),
  st, entered + interval '9 days', entered,
  case when st in ('committed','enrolled') then (select id from sch where i = (hashint4(g * 3) & 2147483647) % (select count(*) from sch)) end,
  case when st in ('enrolled','withdrawn') then entered + interval '30 days' end,
  g % 9 = 0
from (
  select g,
    case when g % 20 < 8 then 'entered' when g % 20 < 15 then 'committed' when g % 20 < 18 then 'enrolled' else 'withdrawn' end st,
    make_timestamptz(2024 + g % 3, 12, 1, 0, 0, 0, 'UTC') + (g % 40) * interval '1 day' + (g % 1440) * interval '1 minute' entered
  from generate_series(1, :n) g
) s;

-- Events: entered, up to 3 offers, then committed/withdrew where the status calls for it.
insert into recruitment_events (recruitment_id, type, occurred_at)
select r.id, 'entered', r.entered_at from recruitments r;
insert into recruitment_events (recruitment_id, type, occurred_at, school_id)
select r.id, 'offered', r.entered_at + k * interval '2 days',
  (select id from sch where i = ((hashint4((r.id * 11 + k)::int) & 2147483647) % ((select count(*) from sch) / 3)) * 3 + k - 1)
from recruitments r cross join generate_series(1, 3) k where (r.id + k) % 4 <> 0;
insert into recruitment_events (recruitment_id, type, occurred_at, school_id)
select r.id, 'committed', r.status_at, r.destination_school_id from recruitments r where r.status in ('committed','enrolled');
insert into recruitment_events (recruitment_id, type, occurred_at)
select r.id, 'withdrew', r.status_at from recruitments r where r.status = 'withdrawn';

insert into published_wire_events (event_id, recruitment_id, player_id, sport_id, kind, cycle_year, type, occurred_at, row)
select e.id, r.id, p.id, ps.sport_id, r.kind, r.cycle_year, e.type, e.occurred_at,
  jsonb_build_object('v',1,'eventId',e.id,'type',e.type,'occurredAt',e.occurred_at,'superseded',false,'playerId',p.id,'slug',p.slug,
    'firstName',p.first_name,'lastName',p.last_name,'highSchoolName',p.high_school_name,'position',ps.position,'heightIn',ps.height_in,
    'weightLb',ps.weight_lb,'isGradTransfer',r.is_grad_transfer,'recruitmentId',r.id,'status',r.status,
    'origin',jsonb_build_object('schoolId',r.origin_school_id),'schoolId',e.school_id)
from recruitment_events e join recruitments r on r.id = e.recruitment_id
join player_sports ps on ps.id = r.player_sport_id join players p on p.id = ps.player_id;

insert into published_players (player_id, slug, indexable, doc)
select p.id, p.slug, true, jsonb_build_object('v',1,'id',p.id,'slug',p.slug,'firstName',p.first_name,'lastName',p.last_name,
  'sports', jsonb_build_array(jsonb_build_object('sportId',ps.sport_id,'position',ps.position,'recruitments',
    (select jsonb_agg(jsonb_build_object('id',e.id,'type',e.type,'occurredAt',e.occurred_at,'schoolId',e.school_id))
     from recruitment_events e where e.recruitment_id = ps.id))))
from players p join player_sports ps on ps.player_id = p.id;
commit;
analyze;
select 'players' t, count(*) from players union all select 'recruitment_events', count(*) from recruitment_events
union all select 'published_wire_events', count(*) from published_wire_events union all select 'published_players', count(*) from published_players;
