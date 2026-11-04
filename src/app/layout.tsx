import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Web3AuthConfigScript from '@/components/Web3AuthConfigScript';
import { AuthProvider } from '@/lib/auth-context';
import { readSession, sessionToAuthUser } from '@/lib/auth-session';
import { SITE, publicBase } from '@/lib/site';
import './globals.css';

// Fonts ship with the repo (src/app/fonts, SIL Open Font License) so builds never fetch from Google:
// a failed Google Fonts download used to fail the build. Same files next/font/google served (latin subset).
const bricolage = localFont({
  src: './fonts/bricolage-grotesque-latin.woff2', variable: '--font-bricolage', weight: '600 700', display: 'swap',
});
const instrument = localFont({
  src: './fonts/instrument-sans-latin.woff2', variable: '--font-instrument', weight: '400 600', display: 'swap',
});
const plexMono = localFont({
  src: './fonts/ibm-plex-mono-500-latin.woff2', variable: '--font-plex-mono', weight: '500', display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicBase()),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { title: `${SITE.name}: ${SITE.tagline}`, description: SITE.description, siteName: SITE.name, type: 'website' },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialUser = sessionToAuthUser(await readSession());
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${plexMono.variable}`}>
      <head>
        <Web3AuthConfigScript />
      </head>
      <body>
        <AuthProvider initialUser={initialUser} initialChecked>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
