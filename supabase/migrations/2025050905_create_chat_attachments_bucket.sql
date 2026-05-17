-- Create chat-attachments storage bucket for customer service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
-- ALTER TABLE storage.objects
-- ENABLE ROW LEVEL SECURITY;


-- Create policy to allow authenticated users to upload to chat-attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Create policy to allow authenticated users to view chat attachments
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Create policy to allow public access to chat attachments (for viewing images in chat)
CREATE POLICY "Public can view chat attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');
