import { getPublishedGuide } from "@/lib/data/knowledge-hub";
import { absoluteUrl, jsonLd } from "@/lib/seo/site";

export default async function KnowledgeHubArticleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const guide = await getPublishedGuide(slug);

  if (!guide) return children;

  const canonical = absoluteUrl(`/knowledge-hub/${guide.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#article`,
    headline: guide.title,
    description: guide.description,
    url: canonical,
    mainEntityOfPage: canonical,
    image: guide.thumbnail_url ?? absoluteUrl("/brand/hypebuzz-banner-v3.png"),
    datePublished: guide.published_at ?? undefined,
    author: {
      "@type": guide.author_name ? "Person" : "Organization",
      name: guide.author_name || "HypeBuzz Editorial",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
      name: "HypeBuzz",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.png"),
    },
  };

  return (
    <>
      {children}
      <script
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        type="application/ld+json"
      />
    </>
  );
}
