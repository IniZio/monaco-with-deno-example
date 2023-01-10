import { useCallback, useRef, useState } from 'react'
import './App.css'
import CodeEditor from './CodeEditor'
import { Monaco, OnChange, OnMount } from '@monaco-editor/react';

const REGEX_DETECT_IMPORT = /(?:(?:(?:import)|(?:export))(?:.)*?from\s+["']([^"']+)["'])|(?:require(?:\s+)?\(["']([^"']+)["']\))|(?:\/+\s+<reference\s+path=["']([^"']+)["']\s+\/>)/g;

function parseDependencies(source: string): string[] {
  return [...source.matchAll(REGEX_DETECT_IMPORT)]
    .map(x => x[1] ?? x[2] ?? x[3])
    .filter(x => !!x);
}

const code = `import { HookEvent } from "https://deno.land/x/authgear_deno_hook@v0.4.0/mod.ts";

export default async function(e: HookEvent): Promise<void> {
  // Write your hook with the help of the type definition.
  //
  // Since this hook will receive all events,
  // you usually want to differentiate the exact event type,
  // and handle the events accordingly.
  // This can be done by using a switch statement as shown below.

  switch (e.type) {
  case "user.created":
    // Thanks to TypeScript compiler, e is now of type EventUserCreated.
    break;
  default:
    // Add a default case to catch the rest.
    // You can add more case to match other events.
    break;
  }
}
`

function App() {
  const monacoRef = useRef<Monaco>();
  const [resolvedDeps, _] = useState(() => new Map());

  const resolveImports = useCallback(async (value: string | undefined) => {
    if (!value) {
      return;
    }

    const monaco = monacoRef.current;
    if (!monaco) {
      return;
    }

    for (const dep of parseDependencies(value)) {
      if (resolvedDeps.has(dep)) {
        continue;
      }
      resolvedDeps.set(dep, true);

      const source = `declare module '${dep}' { ${await fetch(dep).then((r) => r.text())} }`;

      monaco.languages.typescript.typescriptDefaults.addExtraLib(source, `inmemory://model/${dep}`);
      monaco.editor.createModel(source, 'typescript', monaco.Uri.file(`inmemory://model/${dep}`));
    }
  }, [])

  const handleEditorMount = useCallback<OnMount>(async (editor, monaco) => {
    monacoRef.current = monaco;

    let options = monaco.languages.typescript.typescriptDefaults.getCompilerOptions()
    options.strictNullChecks = true
    options.moduleResolution = monaco.languages.typescript.ModuleResolutionKind.NodeJs;
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);

    resolveImports(editor.getValue());
  }, []);

  const handleEditorChange = useCallback<OnChange>(async (value) => {
    resolveImports(value);
  }, []);

  return (
    <div className="App">
      <CodeEditor className="editor" language="typescript" value={code} onMount={handleEditorMount} onChange={handleEditorChange} options={{ minimap: { enabled: false } }} />
    </div>
  )
}

export default App
