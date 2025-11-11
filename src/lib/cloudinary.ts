// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dqjhjeqrj',
  uploadPreset: 'timepass',
};

/**
 * Upload image or video to Cloudinary
 * @param file - File to upload
 * @returns Promise with the uploaded file URL
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
