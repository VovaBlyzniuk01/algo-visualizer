import React from 'react';
import { useNavigate } from 'react-router-dom';
import { algorithmsData } from '../../data/algorithmsData';
import { useLanguage } from '../../context/LanguageContext';

const labels = {
  en: {
    preview: 'Live Preview',
    opening: 'Open Module',
    surface: 'Realtime module preview',
  },
  ua: {
    preview: 'Live Preview',
    opening: 'Відкрити модуль',
    surface: 'Живе превʼю модуля',
  },
};

const accentClasses = {
  cyan: {
    pill: 'text-cyan-100',
    title: 'text-cyan-100',
    button: 'text-cyan-950',
  },
  emerald: {
    pill: 'text-emerald-100',
    title: 'text-emerald-100',
    button: 'text-emerald-950',
  },
  fuchsia: {
    pill: 'text-fuchsia-100',
    title: 'text-fuchsia-100',
    button: 'text-fuchsia-950',
  },
  amber: {
    pill: 'text-amber-100',
    title: 'text-amber-100',
    button: 'text-amber-950',
  },
  rose: {
    pill: 'text-rose-100',
    title: 'text-rose-100',
    button: 'text-rose-950',
  },
  yellow: {
    pill: 'text-yellow-100',
    title: 'text-yellow-100',
    button: 'text-yellow-950',
  },
};

function AlgorithmCard({ algorithm, language, openLabel, previewLabel, navigate }) {
  const Preview = algorithm.preview;
  const colorSet = accentClasses[algorithm.accent.key];
  const title = algorithm.title[language] ?? algorithm.title.en;
  const isActive = Boolean(algorithm.route);

  return (
    <article
      className="group relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-[2rem] border bg-white/[0.045] p-5 backdrop-blur-xl"
      style={{
        borderColor: `${algorithm.accent.hex}33`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(4, 8, 18, 0.52), 0 0 0 1px rgba(255,255,255,0.02)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at top left, ${algorithm.accent.softGlow}, transparent 34%), radial-gradient(circle at 88% 18%, ${algorithm.accent.softGlow}, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px ${algorithm.accent.hex}55, inset 0 0 44px ${algorithm.accent.softGlow}, 0 0 50px ${algorithm.accent.glow}`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between gap-4">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.34em] ${colorSet.pill}`}
            style={{
              borderColor: `${algorithm.accent.hex}55`,
              backgroundColor: `${algorithm.accent.hex}1c`,
              boxShadow: `0 0 18px ${algorithm.accent.softGlow}`,
            }}
          >
            {previewLabel}
          </span>
          <span className="text-[10px] uppercase tracking-[0.35em] text-white/35">{isActive ? 'ACTIVE' : 'R&D'}</span>
        </div>

        <Preview accent={algorithm.accent.hex} />

        <div className="mt-6 flex flex-1 flex-col">
          <p className="text-[11px] uppercase tracking-[0.36em] text-white/40">{algorithm.id}</p>
          <h2 className={`mt-3 text-[1.85rem] font-semibold leading-tight tracking-[0.01em] text-white ${colorSet.title}`}>
            {title}
          </h2>

          <button
            type="button"
            onClick={() => {
              if (algorithm.route) {
                navigate(algorithm.route);
              }
            }}
            className={`mt-7 inline-flex w-fit items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${
              isActive ? 'cursor-pointer group-hover:translate-x-1' : 'cursor-default opacity-75'
            } ${colorSet.button}`}
            style={{
              backgroundColor: algorithm.accent.hex,
              boxShadow: `0 0 22px ${algorithm.accent.glow}`,
            }}
          >
            <span>{openLabel}</span>
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const Hub = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const copy = labels[language] ?? labels.en;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040914] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,210,255,0.1),transparent_24%),radial-gradient(circle_at_22%_68%,rgba(217,70,239,0.08),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.1),transparent_20%),linear-gradient(180deg,#040914,#071120_45%,#030611)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:88px_88px]" />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl justify-end px-6 py-6 lg:px-10">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
          <button
            onClick={() => setLanguage('ua')}
            className={`rounded-lg px-3 py-1 text-sm font-semibold transition-all ${
              language === 'ua' ? 'bg-cyan-300 text-slate-950' : 'text-cyan-100 hover:bg-white/10'
            }`}
          >
            UA
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`rounded-lg px-3 py-1 text-sm font-semibold transition-all ${
              language === 'en' ? 'bg-cyan-300 text-slate-950' : 'text-cyan-100 hover:bg-white/10'
            }`}
          >
            EN
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pb-16 lg:px-10">
        <section className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.42em] text-cyan-100/65">{copy.surface}</p>
          <h1 className="mt-4 max-w-4xl pb-2 text-5xl font-semibold tracking-tight leading-[1.18] text-transparent bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text md:text-6xl lg:text-7xl">
            {t.hubTitle}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/62 md:text-lg">{t.hubDesc}</p>
        </section>

        <section className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          {algorithmsData.map((algorithm) => (
            <AlgorithmCard
              key={algorithm.id}
              algorithm={algorithm}
              language={language}
              openLabel={copy.opening}
              previewLabel={copy.preview}
              navigate={navigate}
            />
          ))}
        </section>
      </main>

      <footer className="relative z-10 pb-8 text-center text-xs tracking-[0.24em] text-white/25">{t.footer}</footer>
    </div>
  );
};

export default Hub;
