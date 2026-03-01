import React, { useMemo } from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ca', label: 'Català' },
  { code: 'pt', label: 'Português' }, // pt-PT
];

export default function LanguageMenu() {
  const { i18n } = useTranslation();
  const current = useMemo(
    () => LANGS.find(l => l.code === (i18n.language || 'en').slice(0, 2))?.label || 'English',
    [i18n.language]
  );

  return (
    <div style={{ position: 'relative' }}>
      <details style={{ position: 'relative' }}>
        <summary style={{
          listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', color: '#334155'
        }}>
          <Languages size={18} /> {current}
        </summary>
        <div style={{
          position: 'absolute', right: 0, marginTop: 8, background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.08)',
          zIndex: 1000, minWidth: 160
        }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                       background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
