-- Allow authenticated users to read from the tutorials bucket
CREATE POLICY "tutorials_read_access"
ON storage.objects FOR SELECT USING (
    bucket_id = 'tutorials'
    AND (select auth.role()) = 'authenticated'
);