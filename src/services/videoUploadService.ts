import { supabase } from '@/lib/supabase';

export interface VideoUploadResult {
  success: boolean;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export class VideoUploadService {
  static async uploadVideo(file: File, creatorId: string, caption: string): Promise<VideoUploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Invalid video type. Please upload MP4, WebM, or QuickTime.' };
      }

      // Max size 100MB
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        return { success: false, error: 'Video too large. Max 100MB.' };
      }

      const fileName = `${creatorId}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage.from('videos').upload(fileName, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      
      // Create record in creator_videos
      const { error: dbError } = await supabase.from('creator_videos').insert({
        creator_id: creatorId,
        video_url: urlData.publicUrl,
        caption: caption,
        creator_name: 'Creator' // Should be fetched from profile
      });

      if (dbError) throw dbError;

      return { success: true, video_url: urlData.publicUrl };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
