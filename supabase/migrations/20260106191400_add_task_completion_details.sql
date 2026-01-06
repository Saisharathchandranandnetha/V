alter table "public"."tasks"
add column "completed_at" timestamp with time zone;

alter table "public"."tasks"
add column "completion_reason" text;
