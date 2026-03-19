import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import {
  Database,
  ChevronRight,
  ChevronDown,
  Table2,
  Cylinder,
  LogOut,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function SchemaExplorer({
  connection,
  onSelectCollection,
  selectedCollection,
  onDisconnect,
}) {
  const { get, post } = useApi();
  const [databases, setDatabases] = useState([]);
  const [expandedDbs, setExpandedDbs] = useState({});
  const [collections, setCollections] = useState({});
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState({});
  const [loaded, setLoaded] = useState(false);

  const loadDatabases = useCallback(async () => {
    setLoadingDbs(true);
    try {
      const data = await get(`/explore/${connection.id}/databases`);
      setDatabases(data);
      setLoaded(true);
    } catch {
      // silent
    } finally {
      setLoadingDbs(false);
    }
  }, [get, connection.id]);

  // Load on first render
  if (!loaded && !loadingDbs) {
    loadDatabases();
  }

  const toggleDatabase = async (dbName) => {
    const isExpanded = expandedDbs[dbName];

    if (isExpanded) {
      setExpandedDbs((prev) => ({ ...prev, [dbName]: false }));
      return;
    }

    setExpandedDbs((prev) => ({ ...prev, [dbName]: true }));

    // Load collections if not cached
    if (!collections[dbName]) {
      setLoadingCollections((prev) => ({ ...prev, [dbName]: true }));
      try {
        const data = await get(
          `/explore/${connection.id}/databases/${dbName}/collections`
        );
        setCollections((prev) => ({ ...prev, [dbName]: data }));
      } catch {
        // silent
      } finally {
        setLoadingCollections((prev) => ({ ...prev, [dbName]: false }));
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await post(`/connections/${connection.id}/disconnect`);
    } catch {
      // silent
    }
    onDisconnect();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-primary flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Database size={14} className="text-accent flex-shrink-0" />
            <span className="text-xs font-semibold truncate">{connection.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadDatabases}
              disabled={loadingDbs}
              className="p-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} className={loadingDbs ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleDisconnect}
              className="p-1 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors"
              title="Disconnect"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-4">
        {loadingDbs && databases.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-accent" />
          </div>
        ) : databases.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">No databases found</p>
        ) : (
          <div className="space-y-0.5">
            {databases.map((db) => (
              <div key={db.name} className="animate-slide-in">
                {/* Database row */}
                <button
                  onClick={() => toggleDatabase(db.name)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition-colors ${
                    expandedDbs[db.name]
                      ? 'bg-bg-active text-text-primary'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  {expandedDbs[db.name] ? (
                    <ChevronDown size={14} className="flex-shrink-0 text-text-muted" />
                  ) : (
                    <ChevronRight size={14} className="flex-shrink-0 text-text-muted" />
                  )}
                  <Cylinder size={14} className="flex-shrink-0 text-warning" />
                  <span className="truncate font-medium text-xs">{db.name}</span>
                  {db.sizeOnDisk > 0 && (
                    <span className="ml-auto text-[10px] text-text-muted flex-shrink-0">
                      {formatSize(db.sizeOnDisk)}
                    </span>
                  )}
                </button>

                {/* Collections */}
                {expandedDbs[db.name] && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {loadingCollections[db.name] ? (
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-text-muted">
                        <Loader2 size={12} className="animate-spin" />
                        Loading collections...
                      </div>
                    ) : (collections[db.name] || []).length === 0 ? (
                      <p className="px-2 py-1.5 text-[11px] text-text-muted italic">
                        Empty database
                      </p>
                    ) : (
                      (collections[db.name] || []).map((col) => {
                        const isSelected =
                          selectedCollection?.dbName === db.name &&
                          selectedCollection?.collectionName === col.name;
                        return (
                          <button
                            key={col.name}
                            onClick={() => onSelectCollection(db.name, col.name)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all ${
                              isSelected
                                ? 'bg-accent/15 text-accent border border-accent/20'
                                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                            }`}
                          >
                            <Table2
                              size={13}
                              className={`flex-shrink-0 ${
                                isSelected ? 'text-accent' : 'text-info'
                              }`}
                            />
                            <span className="truncate">{col.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
