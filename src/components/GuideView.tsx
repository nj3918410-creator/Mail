import React from 'react';
import type { Translations } from '../utils/i18n';

interface GuideViewProps {
  t: Translations;
}

export const GuideView: React.FC<GuideViewProps> = ({ t }) => {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
      <div className="max-w-2xl">
        <h2
          className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100"
          style={{ textWrap: 'balance' }}
        >
          {t.guideView.title}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          {t.guideView.subtitle}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {t.guideView.faqs.map((item, idx) => (
          <div
            key={item.q}
            className="pt-5 border-t border-slate-200 dark:border-slate-800"
          >
            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-1.5 tabular-nums">
              0{idx + 1}.
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {item.q}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
