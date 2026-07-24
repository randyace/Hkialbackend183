type Locale = 'en' | 'zh-Hant';

const POS_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    'pos.custom_request': 'Custom Request',
    'pos.change_quantity': 'Change Quantity',
    'pos.cancel_item': 'Cancel Item',
    'pos.cancel': 'Cancel',
    'pos.save': 'Save',
    'pos.saving': 'Saving...',
    'pos.update_custom_request_for': 'Update the custom request for {{name}}.',
    'pos.update_quantity_for': 'Update quantity for {{name}}.',
    'pos.custom_request_placeholder': 'e.g. Less ice, Extra hot',
    'pos.new': 'New',
    'pos.actions_for': 'Actions for {{name}}',
  },
  'zh-Hant': {
    'pos.custom_request': '客製化要求',
    'pos.change_quantity': '更改數量',
    'pos.cancel_item': '取消項目',
    'pos.cancel': '取消',
    'pos.save': '儲存',
    'pos.saving': '儲存中...',
    'pos.update_custom_request_for': '更新 {{name}} 的客製化要求。',
    'pos.update_quantity_for': '更新 {{name}} 的數量。',
    'pos.custom_request_placeholder': '例如：少冰、加熱',
    'pos.new': '新增',
    'pos.actions_for': '{{name}} 的操作',
  },
};

function resolveLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const language = navigator.language.toLowerCase();
  if (language.startsWith('zh')) {
    return 'zh-Hant';
  }

  return 'en';
}

export type TranslationOptions = Record<string, string | number>;

/**
 * Lightweight POS i18n helper with the same call shape as react-i18next:
 * `t('pos.custom_request', 'Custom Request')`.
 * Swap this for react-i18next once the admin SPA adopts a global i18n provider.
 */
export function useTranslation(_namespace?: string) {
  const locale = resolveLocale();

  const t = (key: string, defaultValue?: string, options?: TranslationOptions): string => {
    let value =
      POS_STRINGS[locale][key] ??
      POS_STRINGS.en[key] ??
      defaultValue ??
      key;

    if (options) {
      for (const [token, replacement] of Object.entries(options)) {
        value = value.split(`{{${token}}}`).join(String(replacement));
      }
    }

    return value;
  };

  return {
    t,
    i18n: {
      language: locale,
    },
  };
}
