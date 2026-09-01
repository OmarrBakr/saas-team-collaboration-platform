const isAllowedCloudinaryUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

module.exports = isAllowedCloudinaryUrl;
