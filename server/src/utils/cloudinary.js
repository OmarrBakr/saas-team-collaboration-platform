const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const LOGO_FOLDER = 'Flowvia-Workspace-Logos';

const getLogoPublicId = (workspaceId) => `${LOGO_FOLDER}/${workspaceId}`;

const assertCloudinaryConfigured = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }
};

const uploadWorkspaceLogo = (buffer, workspaceId) =>
  new Promise((resolve, reject) => {
    assertCloudinaryConfigured();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: LOGO_FOLDER,
        public_id: workspaceId.toString(),
        overwrite: true,
        resource_type: 'image',
        transformation: [{ width: 256, height: 256, crop: 'limit' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

const uploadCardAttachment = (buffer, boardId, cardId, filename) =>
  new Promise((resolve, reject) => {
    assertCloudinaryConfigured();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `Flowvia-Cards-Attachments/${boardId}/${cardId}`,
        public_id: `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '-')}`,
        overwrite: false,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });

const deleteWorkspaceLogo = (workspaceId) => {
  assertCloudinaryConfigured();
  return cloudinary.uploader.destroy(getLogoPublicId(workspaceId));
};

const deleteCardAttachment = (publicId, resourceType = 'auto') => {
  assertCloudinaryConfigured();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  uploadWorkspaceLogo,
  deleteWorkspaceLogo,
  uploadCardAttachment,
  deleteCardAttachment,
};
