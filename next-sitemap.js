module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.redshirtsports.xyz',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api'],
      },
    ],
  },
}
