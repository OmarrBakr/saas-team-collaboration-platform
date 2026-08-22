const ms = require('ms');

const sameSite = process.env.COOKIE_SAME_SITE || 'lax';

if (!['lax', 'strict', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite,
};

const attachCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: ms(process.env.JWT_LIFETIME),
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: ms(process.env.REFRESH_TOKEN_LIFETIME),
  });
};

module.exports = attachCookies;
module.exports.cookieOptions = cookieOptions;
