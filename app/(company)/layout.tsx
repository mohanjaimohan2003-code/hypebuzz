import { Footer } from "@/components/layout/footer";
import { HomepageHeader } from "@/components/layout/homepage-header";

export default function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen overflow-x-clip bg-[#F8FAFC]" id="main-content">
        {children}
      </main>
      <Footer />
    </>
  );
}
