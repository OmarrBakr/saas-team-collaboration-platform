const ms = require('ms');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
