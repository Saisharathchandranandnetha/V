-- Optimizing for performance
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
