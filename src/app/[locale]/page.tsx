import ReactMarkdown from "react-markdown";
import MainLayout from "@/components/MainLayout";
import VideoBackground from "@/components/VideoBackground";
import { db } from "@/lib/db";
import { pickLocale, readLocalizedText } from "@/lib/localized-setting";

type Params = Promise<{ locale: string }>;

/** Hero image and intro copy, read directly instead of via the settings API. */
async function getHomepage(locale: string) {
  try {
    const [hero, content] = await Promise.all([
      db.siteSettings.findUnique({ where: { key: "heroImage" } }),
      db.siteSettings.findUnique({ where: { key: "homepageContent" } }),
    ]);

    const value = hero?.value;
    const imageUrl =
      typeof value === "string"
        ? value
        : value && typeof value === "object" && "url" in value
        ? ((value as { url?: unknown }).url as string | undefined) ?? null
        : null;

    return {
      heroImage: imageUrl,
      body: content ? pickLocale(readLocalizedText(content.value), locale) : "",
    };
  } catch (error) {
    console.error("Could not read the homepage settings:", error);
    return { heroImage: null, body: "" };
  }
}

export default async function Home({ params }: { params: Params }) {
  const { locale } = await params;
  const { heroImage, body } = await getHomepage(locale);

  return (
    <MainLayout currentPath="/">
      {/* Full viewport, but scoped to this section rather than fixed to it:
          the page scrolls past the hero and the footer follows below.

          `-mt-20` cancels the `pt-20` MainLayout adds for the fixed header, so
          the video reaches the very top of the screen and shows through the
          header's translucent blur. `isolate` keeps the background's z-index
          inside the section, so the header still paints above it.

          `dvh` where supported: on mobile, `vh` is the *largest* viewport, so a
          100vh hero sits partly behind the browser's address bar. */}
      <section className="relative isolate -mt-20 flex min-h-screen items-center justify-center overflow-hidden supports-[min-height:100dvh]:min-h-[100dvh]">
        <VideoBackground
          fallbackImage={heroImage || undefined}
          overlayOpacity={0.6}
        />

        {/* pt-20 keeps the copy clear of the header the video now runs under */}
        <div className="page-shell page-width relative z-10 pt-20 text-center">
          {body && (
            <div className="rich-text rich-text-invert mx-auto max-w-2xl text-lg lg:text-xl">
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
