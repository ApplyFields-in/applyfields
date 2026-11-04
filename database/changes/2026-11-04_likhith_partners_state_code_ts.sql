-- Why: Telangana is stored as 'TS' everywhere (institutions cleanup, web forms); partners still had 'TG' rows,
-- which the directory's state filter (TG -> TS) no longer matches. The API now saves TG as TS.
-- Undo: none needed (TG and TS are the same state). Safe to re-run.
update partners set state_code = 'TS' where state_code = 'TG';
update organizations set state_code = 'TS' where state_code = 'TG';
