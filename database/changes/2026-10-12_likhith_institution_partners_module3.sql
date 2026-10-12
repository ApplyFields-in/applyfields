-- Why: Session 13 — Module 3: College & Institution Partners & Student Admission Inquiries.
-- Database tables institutions, institution_courses, institution_enquiries
-- were provisioned in 01_create_tables.sql.
-- This migration adds performance indexes for student inquiry matching and desk operations.

-- 1. Performance indexes for student enquiries
create index if not exists idx_institution_enquiries_inst on institution_enquiries(institution_id, status);
create index if not exists idx_institution_enquiries_user on institution_enquiries(user_id);
create index if not exists idx_institution_enquiries_course on institution_enquiries(course_id);
create index if not exists idx_institutions_status_geo on institutions(status, state_code);

comment on table institution_enquiries is 'Student admission inquiries submitted to partner colleges and universities.';
