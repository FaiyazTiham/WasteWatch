const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (hasCloudinaryConfig && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

async function getUploadedFileUrl(file, folder = 'wastewatch') {
  if (!file) return null;

  if (!hasCloudinaryConfig) {
    if (process.env.VERCEL) {
      throw new Error('Image uploads require Cloudinary environment variables on Vercel.');
    }
    return `/uploads/${file.filename}`;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image'
    });
    return result.secure_url;
  } finally {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
  }
}

module.exports = { getUploadedFileUrl };
