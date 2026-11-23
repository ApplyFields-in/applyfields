-- Staff's reason when approving/rejecting a partner, shown on the partner's under-review page.
alter table partners add column if not exists verification_note text;
