import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import {
  Database,
  Plus,
  Trash2,
  Plug,
  PlugZap,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

export default function ConnectionManager({ onConnect }) {
  const { get, post, del, loading } = useApi();
  const [connections, setConnections] = useState([]);
  const [formName, setFormName] = useState('');
  const [formUri, setFormUri] = useState('');
  const [showUri, setShowUri] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingUri, setTestingUri] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [formError, setFormError] = useState(null);

  const loadConnections = useCallback(async () => {
    try {
      const data = await get('/connections');
      setConnections(data);
    } catch {
      // silent
    }
  }, [get]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleTest = async () => {
    if (!formUri.trim()) return;
    setTestingUri(true);
    setTestResult(null);
    try {
      const result = await post('/connections/test', { uri: formUri });
      setTestResult({ success: true, info: result.info });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingUri(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUri.trim()) {
      setFormError('Both name and URI are required');
      return;
    }
    setFormError(null);
    try {
      await post('/connections', { name: formName, uri: formUri });
      setFormName('');
      setFormUri('');
      setTestResult(null);
      await loadConnections();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleConnect = async (conn) => {
    setConnectingId(conn.id);
    try {
      await post(`/connections/${conn.id}/connect`);
      onConnect({ id: conn.id, name: conn.name });
    } catch {
      // error shown via alert
    } finally {
      setConnectingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/connections/${id}`);
      await loadConnections();
    } catch {
      // silent
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full p-12">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-600 mb-4 shadow-lg shadow-accent/20">
            <Database size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome to Mongo<span className="text-accent">Vista</span>
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Connect to your MongoDB instance to start exploring
          </p>
        </div>

        {/* New Connection Form */}
        <div className="bg-bg-card border border-border-primary rounded-xl p-8 mb-8 shadow-xl">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Plus size={16} className="text-accent" />
            New Connection
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Connection Name
              </label>
              <input
                id="connection-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My MongoDB Cluster"
                className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                MongoDB URI
              </label>
              <div className="relative">
                <input
                  id="connection-uri"
                  type={showUri ? 'text' : 'password'}
                  value={formUri}
                  onChange={(e) => setFormUri(e.target.value)}
                  placeholder="mongodb+srv://user:password@cluster.mongodb.net"
                  className="w-full px-3 py-2 pr-10 bg-bg-primary border border-border-primary rounded-lg text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                />
                <button
                  onClick={() => setShowUri(!showUri)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                  title={showUri ? 'Hide URI' : 'Show URI'}
                >
                  {showUri ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-error flex items-center gap-1.5">
                <XCircle size={12} />
                {formError}
              </p>
            )}

            {testResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                  testResult.success
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-error/10 text-error border border-error/20'
                }`}
              >
                {testResult.success ? (
                  <>
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Connection successful!</p>
                      <p className="mt-1 text-text-secondary">
                        Host: {testResult.info.host} · v{testResult.info.version}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>{testResult.error}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                id="btn-test-connection"
                onClick={handleTest}
                disabled={!formUri.trim() || testingUri}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-bg-hover border border-border-primary rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testingUri ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                Test
              </button>
              <button
                id="btn-save-connection"
                onClick={handleSave}
                disabled={!formName.trim() || !formUri.trim() || loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/30"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Save Connection
              </button>
            </div>
          </div>
        </div>

        {/* Saved Connections */}
        {connections.length > 0 && (
          <div className="space-y-3 bg-bg-card border border-border-primary rounded-xl p-8 shadow-xl">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              Saved Connections
            </h3>
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="group flex items-center justify-between p-4 bg-bg-primary border border-border-primary rounded-xl hover:border-border-accent/50 transition-all animate-slide-in"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      conn.connected
                        ? 'bg-success/10 text-success'
                        : 'bg-bg-hover text-text-muted'
                    }`}
                  >
                    {conn.connected ? <PlugZap size={16} /> : <Plug size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conn.name}</p>
                    <p className="text-xs text-text-muted font-mono truncate">
                      {conn.uri.replace(/:\/\/[^@]*@/, '://***@')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleConnect(conn)}
                    disabled={connectingId === conn.id}
                    className="p-2 rounded-lg text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                    title="Connect"
                  >
                    {connectingId === conn.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <PlugZap size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
