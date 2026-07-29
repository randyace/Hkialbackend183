/**
 * POS / admin i18n helper — same call shape as react-i18next:
 * `t('pos.custom_request', 'Custom Request')`.
 *
 * Delegates to the global admin i18n provider (RFQ A5 EN+TC+SC).
 */
import { useCallback } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { normalizeLocale } from '@/i18n';
import { translateMessage } from '@/i18n/useMsg';

export type TranslationOptions = Record<string, string | number>;

/** @deprecated Prefer useMsg() for new code; kept for existing POS call sites. */
export function useTranslation(_namespace?: string) {
  const { i18n } = useI18nextTranslation();
  const locale = normalizeLocale(i18n.language);

  const t = useCallback(
    (key: string, defaultValue?: string, options?: TranslationOptions): string => {
      // Prefer English default as catalog key (useMsg style), then namespaced key fallback.
      const englishSource = defaultValue ?? key;
      let value = translateMessage(locale, englishSource);
      if (value === englishSource && defaultValue && key !== defaultValue) {
        // try key as message if default was used as display only
        const byKey = translateMessage(locale, key);
        if (byKey !== key) value = byKey;
      }

      if (options) {
        for (const [token, replacement] of Object.entries(options)) {
          value = value.split(`{{${token}}}`).join(String(replacement));
        }
      }

      return value;
    },
    [locale],
  );

  return {
    t,
    i18n: {
      language: locale,
      changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    },
  };
}
