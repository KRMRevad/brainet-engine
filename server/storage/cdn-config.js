/**
 * CDN Configuration & Signed URL Management
 * Handles Supabase Storage bucket access for Phase 2 media
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Bucket configuration
const BUCKETS = {
  audio: {
    name: 'council-audio',
    maxSize: 500 * 1024 * 1024, // 500MB
    mimeTypes: ['audio/mpeg', 'audio/mp3'],
    expiryDays: 7
  },
  images: {
    name: 'council-images',
    maxSize: 500 * 1024 * 1024, // 500MB
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    expiryDays: 7
  },
  videos: {
    name: 'council-videos',
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    mimeTypes: ['video/mp4', 'video/webm'],
    expiryDays: 7
  }
};

/**
 * Upload file to Supabase Storage
 */
async function uploadFile(bucketType, filename, fileBuffer, mimeType) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  if (!bucket.mimeTypes.includes(mimeType)) {
    throw new Error(`Invalid MIME type for ${bucketType}: ${mimeType}`);
  }

  if (fileBuffer.length > bucket.maxSize) {
    throw new Error(`File too large for ${bucketType} (max ${bucket.maxSize / 1024 / 1024}MB)`);
  }

  const { data, error } = await supabase.storage
    .from(bucket.name)
    .upload(filename, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return data;
}

/**
 * Generate signed URL for accessing stored file
 * Expiry: 7 days by default
 */
async function getSignedUrl(bucketType, filename, expirySeconds = null) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  // Default to bucket's configured expiry (in days → convert to seconds)
  const expiryInSeconds = expirySeconds || (bucket.expiryDays * 24 * 60 * 60);

  const { data, error } = await supabase.storage
    .from(bucket.name)
    .createSignedUrl(filename, expiryInSeconds);

  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
  return data;
}

/**
 * Get public URL (for public buckets)
 * Note: Our buckets are private, so this won't work unless RLS is adjusted
 */
async function getPublicUrl(bucketType, filename) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  const { data } = supabase.storage
    .from(bucket.name)
    .getPublicUrl(filename);

  // Will return URL but won't be accessible unless bucket is public
  // For private buckets, always use getSignedUrl
  return data;
}

/**
 * Delete file from storage
 */
async function deleteFile(bucketType, filename) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  const { error } = await supabase.storage
    .from(bucket.name)
    .remove([filename]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
  return true;
}

/**
 * List files in bucket (useful for admin/debug)
 */
async function listFiles(bucketType) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  const { data, error } = await supabase.storage
    .from(bucket.name)
    .list();

  if (error) throw new Error(`List failed: ${error.message}`);
  return data;
}

/**
 * Check if file exists
 */
async function fileExists(bucketType, filename) {
  const bucket = BUCKETS[bucketType];
  if (!bucket) throw new Error(`Invalid bucketType: ${bucketType}`);

  const { data, error } = await supabase.storage
    .from(bucket.name)
    .list();

  if (error) return false;

  return data.some(file => file.name === filename);
}

/**
 * Initialize buckets (create if don't exist)
 * Called during app startup
 */
async function initializeBuckets() {
  const bucketNames = Object.values(BUCKETS).map(b => b.name);

  for (const bucketName of bucketNames) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: BUCKETS[Object.keys(BUCKETS).find(k => BUCKETS[k].name === bucketName)].maxSize
      });

      if (error && error.statusCode === 409) {
        // Bucket already exists
        console.log(`✓ Bucket "${bucketName}" exists`);
      } else if (error) {
        throw error;
      } else {
        console.log(`✓ Created bucket "${bucketName}"`);
      }
    } catch (e) {
      console.error(`Failed to initialize bucket ${bucketName}:`, e.message);
    }
  }
}

export {
  BUCKETS,
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
  listFiles,
  fileExists,
  initializeBuckets
}
