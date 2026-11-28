import ReactMarkdown from "react-markdown";
import { getTranslations } from "next-intl/server";
import MainLayout from "@/components/MainLayout";
import { pickLocale } from "@/lib/localized-setting";
import { getLegalContent } from "@/lib/legal-server";
import type { LegalPage } from "@/lib/legal";

/**
 * Renders a policy page on the server, so its text is in the HTML for
 * crawlers — and, more to the point, so it is readable with JavaScript off.
 */
export default async function LegalPageView({
  page,
  locale,
}: {
  page: LegalPage;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Legal" });
  const { content, isDefault } = await getLegalContent(page);
  const body = pickLocale(content, locale);

  return (
    <MainLayout currentPath={`/${page}`}>
      <div className="page-shell page-width-narrow">
        <header className="page-header">
          <h1 className="page-title">{t(page)}</h1>
        </header>

        {/* Says plainly that the text is still a skeleton, rather than letting
            placeholder wording read as a real policy. */}
        {isDefault && <div className="notice mb-8">{t("draftNotice")}</div>}

        <div className="rich-text">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </div>
    </MainLayout>
  );
}
