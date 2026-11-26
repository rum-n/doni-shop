import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="page-title mb-4">{t("title")}</h1>
        <p className="mb-8 font-light leading-relaxed text-ink-soft">
          {t("body")}
        </p>
        <Link href="/" className="btn btn-primary">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
