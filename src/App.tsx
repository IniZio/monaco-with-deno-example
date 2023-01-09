import { useCallback } from 'react'
import './App.css'
import CodeEditor from './CodeEditor'
import { OnMount } from '@monaco-editor/react';

const code = `import { HookEvent } from "https://deno.land/x/authgear_deno_hook@v0.3.0/mod.ts";

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
  const handleEditorMount = useCallback<OnMount>(async (editor, monaco) => {
    let options = monaco.languages.typescript.typescriptDefaults.getCompilerOptions()
    options.strictNullChecks = true
    options.moduleResolution = monaco.languages.typescript.ModuleResolutionKind.NodeJs;
    options.typeRoots = ["node_modules/@types"]
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options)

    const URLImport = "https://deno.land/x/authgear_deno_hook@v0.3.0/mod.ts";
    const source = `declare module '${URLImport}' { ${await fetch(URLImport).then((r) => r.text())} }`;

    // URLImport here does not matter as long as match these 2 lines
    monaco.languages.typescript.typescriptDefaults.addExtraLib(source, `file:///node_modules/@types/${URLImport}/index.d.ts`);
    monaco.editor.createModel(source, 'typescript', monaco.Uri.file(`file:///node_modules/@types/${URLImport}/index.d.ts`));
  }, [])

  return (
    <div className="App">
      <CodeEditor className="editor" language="typescript" value={code} onMount={handleEditorMount} options={{ minimap: { enabled: false } }} />
    </div>
  )
}

export default App
