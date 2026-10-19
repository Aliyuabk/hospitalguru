declare module 'pouchdb-browser' {
  const PouchDB: new (name: string) => {
    put(document: Record<string, unknown>): Promise<unknown>;
    allDocs(options: { include_docs: boolean }): Promise<{ rows: { doc?: unknown }[] }>;
  };
  export default PouchDB;
}
