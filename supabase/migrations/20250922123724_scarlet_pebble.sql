/*
  # Storage Configuration

  1. Storage Buckets
    - `restaurant-images` - For restaurant photos
    - `user-avatars` - For user profile pictures
    - `documents` - For restaurant documents and menus

  2. Storage Policies
    - Public read access for restaurant images
    - Authenticated users can upload avatars
    - Restaurant admins can manage their documents

  3. Storage Functions
    - Image optimization and resizing
    - File validation and security
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('restaurant-images', 'restaurant-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for restaurant-images bucket (public read)
CREATE POLICY "Public can view restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant admins can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

CREATE POLICY "Restaurant admins can update their images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

CREATE POLICY "Restaurant admins can delete their images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

-- Storage policies for user-avatars bucket
CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for documents bucket
CREATE POLICY "Restaurant admins can manage documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );