import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, X, Copy, Check } from 'lucide-react';

/**
 * JsonCell — Expandable cell renderer for nested JSON objects/arrays.
 * Shows a collapsed preview badge and expands into a floating panel on click.
 */
export default function JsonCell({ value }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  const isArray = Array.isArray(value);
  const itemCount = isArray ? value.length : Object.keys(value).length;
  const label = isArray ? `[${itemCount} items]` : `{${itemCount} keys}`;

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !triggerRef.current.contains(e.target)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${
          isArray
            ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
        }`}
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {label}
      </button>

      {expanded && (
        <div
          ref={panelRef}
          className="absolute z-50 top-full left-0 mt-1 w-80 max-h-72 overflow-auto bg-bg-card border border-border-primary rounded-xl shadow-2xl shadow-black/40 animate-fade-in"
        >
          {/* Panel header */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-bg-tertiary border-b border-border-primary rounded-t-xl">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              {isArray ? 'Array' : 'Object'} · {itemCount}{' '}
              {isArray ? 'items' : 'keys'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                title="Copy JSON"
              >
                {copied ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* JSON tree */}
          <div className="p-4">
            <JsonTree data={value} depth={0} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Recursive JSON tree renderer.
 */
function JsonTree({ data, depth }) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null || data === undefined) {
    return <span className="text-text-muted italic">null</span>;
  }

  if (typeof data !== 'object') {
    return <JsonValue value={data} />;
  }

  const isArray = Array.isArray(data);
  const entries = isArray
    ? data.map((val, idx) => [idx, val])
    : Object.entries(data);

  if (entries.length === 0) {
    return <span className="text-text-muted font-mono text-[11px]">{isArray ? '[]' : '{}'}</span>;
  }

  return (
    <div className="text-[11px]">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="inline-flex items-center gap-0.5 text-text-muted hover:text-text-secondary transition-colors"
      >
        {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
        <span className="font-mono">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>

      {!collapsed && (
        <div className="ml-3 pl-2 border-l border-border-subtle">
          {entries.map(([key, val]) => (
            <div key={key} className="py-0.5 flex items-start gap-1.5">
              <span
                className={`flex-shrink-0 font-mono font-medium ${
                  isArray ? 'text-purple-400' : 'text-amber-400'
                }`}
              >
                {isArray ? `${key}:` : `"${key}":`}
              </span>
              <div className="min-w-0">
                {typeof val === 'object' && val !== null ? (
                  <JsonTree data={val} depth={depth + 1} />
                ) : (
                  <JsonValue value={val} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JsonValue({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-text-muted italic font-mono">null</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`font-mono ${value ? 'text-success' : 'text-error'}`}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-blue-400">{value}</span>;
  }
  // String
  const str = String(value);
  return (
    <span className="font-mono text-emerald-400 break-all" title={str}>
      "{str.length > 80 ? str.slice(0, 80) + '…' : str}"
    </span>
  );
}
