import SiteBanner from '@/components/SiteBanner';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

/** The full site: banner, header and footer. The temporary landing page at / sits outside this group. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteBanner />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
