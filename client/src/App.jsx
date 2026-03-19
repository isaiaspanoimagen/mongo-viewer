import { useState } from 'react';
import { Database } from 'lucide-react';
import ConnectionManager from './components/ConnectionManager';
import SchemaExplorer from './components/SchemaExplorer';
import DocumentViewer from './components/DocumentViewer';

export default function App() {
  const [connection, setConnection] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const handleConnect = (conn) => {
    setConnection(conn);
    setSelectedCollection(null);
  };

  const handleDisconnect = () => {
    setConnection(null);
    setSelectedCollection(null);
  };

  const handleSelectCollection = (dbName, collectionName) => {
    setSelectedCollection({ dbName, collectionName });
  };

  return (
    <div className="h-screen bg-bg-primary text-text-primary">
      {!connection ? (
        <ConnectionManager onConnect={handleConnect} />
      ) : (
        <div className="h-full grid grid-cols-[320px_1fr]">
          <aside className="border-r border-border-primary bg-bg-card min-h-0">
            <SchemaExplorer
              connection={connection}
              selectedCollection={selectedCollection}
              onSelectCollection={handleSelectCollection}
              onDisconnect={handleDisconnect}
            />
          </aside>

          <main className="min-h-0">
            {selectedCollection ? (
              <DocumentViewer
                connectionId={connection.id}
                dbName={selectedCollection.dbName}
                collectionName={selectedCollection.collectionName}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md animate-fade-in">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-card border border-border-primary mb-4">
                    <Database size={24} className="text-accent" />
                  </div>
                  <h1 className="text-lg font-semibold mb-2">Select a collection</h1>
                  <p className="text-sm text-text-secondary">
                    Expand a database from the left sidebar to start browsing documents.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
