import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Page not found" sub="The link is broken or the page moved." />
      <EmptyState
        title="404"
        sub="Double-check the address, or head back to familiar ground."
        action={<Link to="/" className="btn-primary">Back to home</Link>}
      />
    </div>
  );
}
