import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind | Debug" },
];

export default function Debug() {
  const { auth, isLoading, ai, kv } = usePuterStore();
  const [models, setModels] = useState<string[]>([]);
  const [testResult, setTestResult] = useState("");
  const [testError, setTestError] = useState("");
  const [kvKeys, setKvKeys] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const puter = (window as any).puter;
      if (!puter?.ai?.listModels) {
        setModels(["listModels() not available on this Puter version"]);
        return;
      }
      const result = await puter.ai.listModels();
      console.log("Models:", result);
      if (Array.isArray(result)) {
        setModels(result.map((m: any) => (typeof m === "string" ? m : m?.id || JSON.stringify(m))));
      } else {
        setModels([JSON.stringify(result)]);
      }
    } catch (e: any) {
      setModels(["Error: " + e?.message]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const testSimpleChat = async () => {
    setIsTesting(true);
    setTestResult("");
    setTestError("");
    try {
      const puter = (window as any).puter;
      const response = await puter.ai.chat(
        "Say the word HELLO and nothing else.",
        { model: "claude-sonnet-4-5" },
      );
      console.log("Simple chat response:", response);
      setTestResult(JSON.stringify(response, null, 2));
    } catch (e: any) {
      console.error("Simple chat error:", e);
      setTestError(e?.message || String(e));
    } finally {
      setIsTesting(false);
    }
  };

  const loadKvKeys = async () => {
    try {
      const keys = await kv.list("resume-*");
      if (Array.isArray(keys)) {
        setKvKeys(keys.map((k: any) => (typeof k === "string" ? k : JSON.stringify(k))));
      } else {
        setKvKeys(["No keys or unexpected format: " + JSON.stringify(keys)]);
      }
    } catch (e: any) {
      setKvKeys(["Error: " + e?.message]);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🔧 Debug Panel</h1>
      <p className="text-gray-500 text-sm mb-8">Use this to diagnose AI and KV issues. Check your browser console too.</p>

      {/* Auth Status */}
      <section className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <h2 className="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wide">Auth Status</h2>
        <p className="text-sm">
          isLoading: <strong>{String(isLoading)}</strong> | 
          isAuthenticated: <strong>{String(auth.isAuthenticated)}</strong> | 
          user: <strong>{auth.user?.username ?? "none"}</strong>
        </p>
      </section>

      {/* Model List */}
      <section className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Available Models</h2>
          <button
            onClick={loadModels}
            disabled={isLoadingModels}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {isLoadingModels ? "Loading..." : "Load Models"}
          </button>
        </div>
        {models.length > 0 && (
          <div className="max-h-48 overflow-y-auto">
            {models.filter(m => m.toLowerCase().includes("claude") || m.toLowerCase().includes("sonnet")).map((m, i) => (
              <p key={i} className="text-xs font-mono text-gray-700 py-0.5">{m}</p>
            ))}
            <p className="text-xs text-gray-400 mt-2">Total: {models.length} models (showing Claude-related only above)</p>
          </div>
        )}
      </section>

      {/* Simple AI Test */}
      <section className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Test Simple AI Call</h2>
          <button
            onClick={testSimpleChat}
            disabled={isTesting || !auth.isAuthenticated}
            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? "Testing..." : "Run Test"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Tests: <code>puter.ai.chat("Say HELLO", {"{ model: 'claude-sonnet-4-5' }"})</code></p>
        {testResult && (
          <pre className="text-xs bg-green-50 border border-green-200 rounded-lg p-3 overflow-x-auto max-h-48 text-green-900">
            {testResult}
          </pre>
        )}
        {testError && (
          <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 overflow-x-auto text-red-700">
            ERROR: {testError}
          </pre>
        )}
      </section>

      {/* KV Keys */}
      <section className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">KV Store — resume-* keys</h2>
          <button
            onClick={loadKvKeys}
            disabled={!auth.isAuthenticated}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            Load Keys
          </button>
        </div>
        {kvKeys.length > 0 ? (
          kvKeys.map((k, i) => (
            <p key={i} className="text-xs font-mono text-gray-700 py-0.5">{k}</p>
          ))
        ) : (
          <p className="text-xs text-gray-400">No keys loaded yet</p>
        )}
      </section>

      <p className="text-xs text-gray-400 text-center">
        Remove this page before production. Open browser DevTools console for full logs.
      </p>
    </main>
  );
}
