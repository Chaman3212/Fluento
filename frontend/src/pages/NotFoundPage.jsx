import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-3xl font-bold tracking-tight">This page doesn’t exist</h1>
      <p className="text-muted">The link may be broken or the page may have moved.</p>
      <Link to="/" className="btn-primary mt-3">Back to home</Link>
    </div>
  );
}
