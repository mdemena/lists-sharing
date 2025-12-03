-- Create bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Users can upload item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- Policy: Allow public read access to images
CREATE POLICY "Public can view item images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'item-images');

-- Policy: Allow users to delete their own images
-- Images are stored in folders named by user_id, so we check the first folder in the path
CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
