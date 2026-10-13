import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import DocCard from '../components/DocCard.jsx';
import { EmptyState, PageHeader, Spinner } from '../components/ui.jsx';

export default function Bookmarks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookmarks')
      .then(({ data }) => {
        const list = data?.data || data?.bookmarks || [];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const docs = items.map((b) => b.documentId || b.doc || b).filter((d) => d && (d._id || d.id));

  return (
    <div>
      <PageHeader title="Saved items" sub="Your personal shortlist across the library." />
      {loading ? <Spinner /> : docs.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => <DocCard key={doc._id || doc.id} doc={doc} />)}
        </div>
      ) : (
        <EmptyState
          title="Nothing saved yet"
          sub="Open any document and hit “Save to bookmarks” — it will appear here."
          action={<Link to="/browse" className="btn-primary">Browse library</Link>}
        />
      )}
    </div>
  );
}
