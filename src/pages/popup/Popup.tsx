/**
 * Renders the popup settings UI and allows switching language persisted in storage.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_CHANGE_MESSAGE_TYPE, setLanguage } from '@src/services/i18n';
import type { Language } from '@src/types/settings';

/**
 * Popup settings panel.
 * @returns JSX.Element
 *
 * Modification Notes:
 *   - 2026-03-09 [Qiuner] Added language switching with persistence and content-script notification.
 */
export default function Popup() {
  const { t, i18n } = useTranslation();
  const resolved = i18n.resolvedLanguage;
  const currentLanguage: Language = resolved === 'zh' ? 'zh' : resolved === 'zh-TW' ? 'zh-TW' : 'en';

  /**
   * Notifies the active tab content script to switch language at runtime.
   * @param lang Language - The language to activate in the content script.
   * @returns Promise<void>
   */
  const notifyActiveTab = async (lang: Language) => {
    try {
      if (!chrome?.tabs) return;
      const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (result) => resolve(result));
      });
      const tabId = tabs[0]?.id;
      if (typeof tabId !== 'number') return;
      const maybePromise = (chrome.tabs.sendMessage as unknown as (tabId: number, message: unknown) => unknown)(
        tabId,
        { type: LANGUAGE_CHANGE_MESSAGE_TYPE, lang },
      );
      if (maybePromise && typeof (maybePromise as { catch?: unknown }).catch === 'function') {
        void (maybePromise as Promise<unknown>).catch(() => {
          return;
        });
      }
    } catch {
      return;
    }
  };

  /**
   * Handles language selection changes: updates i18n, persists preference, and notifies the active tab.
   * @param lang Language - The newly selected language.
   * @returns void
   */
  const handleLanguageChange = (lang: Language) => {
    void (async () => {
      await setLanguage(lang);
      await notifyActiveTab(lang);
    })();
  };

  return (
    <div className="h-full w-[280px] rounded-[12px] border border-[#E5E0D8] bg-[#F5F0EB] p-4 text-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <div className="text-[14px] font-semibold leading-none">{t('popup.title')}</div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-[13px] text-[#1A1A1A]">{t('popup.language')}</div>
        <select
          className="rounded bg-[#EFEFED] px-2 py-1 text-[13px] text-[#1A1A1A] border border-[#E5E0D8]"
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
        >
          <option value="en">{t('popup.languageEn')}</option>
          <option value="zh">{t('popup.languageZh')}</option>
          <option value="zh-TW">{t('popup.languageZhTW')}</option>
        </select>
      </div>
      <div className="mt-2 text-[12px] text-[#6B6B6B]">{t('popup.hint')}</div>
    </div>
  );
}
