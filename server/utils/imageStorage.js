const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return true;
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
  return true;
}

async function getUploadedFileUrl(file, folder = 'wastewatch') {
  if (!file) return null;

  if (!configureCloudinary()) {
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
  } catch (err) {
    console.error('Cloudinary upload failed:', {
      message: err.message,
      http_code: err.http_code,
      file: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  } finally {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
  }
}

module.exports = { getUploadedFileUrl };
