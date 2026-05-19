import { useState, useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json as jsonLang, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { githubLight, githubDarkInit } from '@uiw/codemirror-theme-github';
import { EditorView } from '@codemirror/view';

const darkTheme = githubDarkInit({
  settings: {
    background: '#0f172a',
    gutterBackground: '#1e293b',
    gutterBorder: 'transparent',
    gutterForeground: '#475569',
    lineHighlight: 'rgba(255,255,255,0.025)',
    selection: 'rgba(148,163,184,0.2)',
    selectionMatch: 'rgba(148,163,184,0.12)',
    caret: '#94a3b8',
  },
});

const scrollFix = EditorView.theme({
  '.cm-scroller': { overscrollBehavior: 'contain' },
});

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export function JsonCodeEditor({ value, onChange, height = '400px' }: JsonCodeEditorProps) {
  const dark = useDarkMode();
  const extensions = useMemo(
    () => [jsonLang(), linter(jsonParseLinter()), lintGutter(), scrollFix],
    [],
  );

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 text-xs">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={dark ? darkTheme : githubLight}
        extensions={extensions}
        height={height}
        basicSetup={{ tabSize: 2 }}
      />
    </div>
  );
}
