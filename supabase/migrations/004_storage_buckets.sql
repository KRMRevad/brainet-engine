-- Create Storage Buckets for Phase 2 Content (Audio, Images, Video)
-- Date: 2026-02-26
-- Purpose: Store media assets generated from council outputs

-- Bucket 1: Audio files (ElevenLabs TTS output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-audio',
  'council-audio',
  false,
  536870912, -- 500MB
  now()
) ON CONFLICT (id) DO NOTHING;

-- Bucket 2: Images (Google Whisk/Imagen output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-images',
  'council-images',
  false,
  536870912, -- 500MB
  now()
) ON CONFLICT (id) DO NOTHING;

-- Bucket 3: Videos (Google Flow/Veo output)
INSERT INTO storage.buckets (id, name, public, file_size_limit, created_at)
VALUES (
  'council-videos',
  'council-videos',
  false,
  5368709120, -- 5GB
  now()
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Audio Bucket
-- Private access (only authenticated users can read via signed URLs)
CREATE POLICY "Audio: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-audio');

CREATE POLICY "Audio: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-audio'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Audio: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-audio'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Images Bucket
CREATE POLICY "Images: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-images');

CREATE POLICY "Images: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Images: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-images'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for Videos Bucket
CREATE POLICY "Videos: Allow public read via signed URL"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'council-videos');

CREATE POLICY "Videos: Allow authenticated upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'council-videos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Videos: Allow authenticated delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'council-videos'
    AND auth.role() = 'authenticated'
  );

-- Grant permissions to service_role (for backend automation)
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;
