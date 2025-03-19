import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'bg', 'de'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/', '/(bg|de)/:path*'],
};