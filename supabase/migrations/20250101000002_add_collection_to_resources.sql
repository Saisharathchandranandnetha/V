alter table resources 
add column if not exists collection_id uuid references collections(id) on delete set null;
