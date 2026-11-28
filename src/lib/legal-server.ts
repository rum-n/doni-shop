import { db } from "@/lib/db";
import { readLocalizedText, type LocalizedText } from "@/lib/localized-setting";
import {
  DEFAULT_CONTENT,
  legalSettingsKey,
  type LegalPage,
} from "@/lib/legal";

/**
 * A policy page's content, read on the server.
 *
 * Falls back to the shipped skeleton when nothing has been saved, so the page
 * is never blank — and the admin flags it as unedited.
 */
export async function getLegalContent(
  page: LegalPage
): Promise<{ content: LocalizedText; isDefault: boolean }> {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: legalSettingsKey(page) },
    });

    if (!setting) {
      return { content: DEFAULT_CONTENT[page], isDefault: true };
    }

    return { content: readLocalizedText(setting.value), isDefault: false };
  } catch (error) {
    console.error(`Could not read the ${page} page:`, error);
    return { content: DEFAULT_CONTENT[page], isDefault: true };
  }
}
