create or replace function public.get_admin_dashboard(
  p_range text,
  p_timezone text default 'Asia/Ho_Chi_Minh'
)
returns json
language sql
security definer
set search_path = public
as $$
with bounds as (
  select
    (current_timestamp at time zone p_timezone)::date as today,
    case p_range
      when 'today' then (current_timestamp at time zone p_timezone)::date
      when '30d' then (current_timestamp at time zone p_timezone)::date - 29
      else (current_timestamp at time zone p_timezone)::date - 6
    end as start_day
),
period_events as (
  select e.*, (e.created_at at time zone p_timezone)::date as local_day
  from events e, bounds b
  where (e.created_at at time zone p_timezone)::date between b.start_day and b.today
),
previous_events as (
  select e.*, (e.created_at at time zone p_timezone)::date as local_day
  from events e, bounds b
  where (e.created_at at time zone p_timezone)::date between
    b.start_day - (b.today - b.start_day + 1) and b.start_day - 1
),
metric_values as (
  select
    count(distinct session_id) filter (where name = 'page_view') as visits,
    count(*) filter (where name = 'booking_start') as booking_start,
    count(*) filter (where name = 'booking_complete') as booking_complete
  from period_events
),
previous_metric_values as (
  select
    count(distinct session_id) filter (where name = 'page_view') as visits,
    count(*) filter (where name = 'booking_start') as booking_start,
    count(*) filter (where name = 'booking_complete') as booking_complete
  from previous_events
),
daily as (
  select local_day, count(distinct session_id) filter (where name = 'page_view') as visits,
    count(*) filter (where name in ('booking_start', 'booking_complete')) as bookings
  from period_events group by local_day order by local_day
),
hourly as (
  select extract(hour from (created_at at time zone p_timezone))::int as hour_number,
    lpad(extract(hour from (created_at at time zone p_timezone))::int::text, 2, '0') || ':00' as hour,
    count(*) as bookings
  from period_events
  where name in ('booking_start', 'booking_complete')
  group by 1, 2 order by hour_number
),
today_summary as (
  select
    count(*) filter (where name in ('booking_start', 'booking_complete')) as bookings
  from period_events, bounds
  where local_day = bounds.today
),
weekday as (
  select extract(isodow from (created_at at time zone p_timezone))::int as weekday_number,
    to_char(created_at at time zone p_timezone, 'Dy') as day,
    count(*) as bookings
  from period_events
  where name in ('booking_start', 'booking_complete')
  group by 1, 2 order by weekday_number
),
sources as (
  select coalesce(nullif(utm_source, ''), nullif(referrer, ''), 'Trực tiếp') as source,
    count(distinct session_id) as visits
  from period_events where name = 'page_view'
  group by 1 order by visits desc limit 10
),
devices as (
  select coalesce(device, 'Không rõ') as device, count(distinct session_id) as visits
  from period_events where name = 'page_view'
  group by 1 order by visits desc
),
pages as (
  select split_part(path, '?', 1) as path, count(*) as views
  from period_events where name = 'page_view'
  group by 1 order by views desc limit 5
),
menu_items as (
  select coalesce(nullif(split_part(split_part(path, 'item=', 2), '&', 1), ''), 'Không rõ') as item,
    count(*) as views
  from period_events where name = 'menu_item_view'
  group by 1 order by views desc limit 5
),
actions as (
  select count(*) filter (where name = 'call_click') as calls,
    count(*) filter (where name = 'directions_click') as directions
  from period_events
)
select json_build_object(
  'metrics', json_build_array(
    json_build_object('key','visits','label','Lượt truy cập','value',m.visits,'previous',pm.visits),
    json_build_object('key','booking_start','label','Bắt đầu đặt bàn','value',m.booking_start,'previous',pm.booking_start),
    json_build_object('key','booking_complete','label','Đặt bàn hoàn tất','value',m.booking_complete,'previous',pm.booking_complete),
    json_build_object('key','conversion','label','Tỷ lệ chuyển đổi','value',case when m.visits = 0 then null else round(m.booking_complete * 100.0 / m.visits, 2) end,'previous',case when pm.visits = 0 then null else round(pm.booking_complete * 100.0 / pm.visits, 2) end,'suffix','%'),
    json_build_object('key','guests','label','Tổng số khách đã đặt','value',null,'previous',null),
    json_build_object('key','no_show','label','Tỷ lệ no-show','value',null,'previous',null,'suffix','%'),
    json_build_object('key','cancelled','label','Tỷ lệ hủy','value',null,'previous',null,'suffix','%')
  ),
  'daily', coalesce((select json_agg(json_build_object('date', local_day, 'visits', visits, 'bookings', bookings)) from daily), '[]'::json),
  'sources', coalesce((select json_agg(json_build_object('source', source, 'visits', visits)) from sources), '[]'::json),
  'devices', coalesce((select json_agg(json_build_object('device', device, 'visits', visits)) from devices), '[]'::json),
  'pages', coalesce((select json_agg(json_build_object('path', path, 'views', views)) from pages), '[]'::json),
  'menuItems', coalesce((select json_agg(json_build_object('item', item, 'views', views)) from menu_items), '[]'::json),
  'actions', row_to_json(actions),
  'hourly', coalesce((select json_agg(json_build_object('hour', hour, 'bookings', bookings) order by hour_number) from hourly), '[]'::json),
  'weekday', coalesce((select json_agg(json_build_object('day', day, 'bookings', bookings) order by weekday_number) from weekday), '[]'::json),
  'today', json_build_object('bookings', (select bookings from today_summary), 'guests', null, 'upcoming', '[]'::json)
)
from metric_values m, previous_metric_values pm, actions;
$$;

revoke all on function public.get_admin_dashboard(text, text) from public, anon, authenticated;
grant execute on function public.get_admin_dashboard(text, text) to service_role;
