import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { venueMap } from './data/venues';

const Comparison = lazy(() => import('./components/Comparison').then((module) => ({ default: module.Comparison })));
const VenueWorkspace = lazy(() => import('./components/VenueWorkspace').then((module) => ({ default: module.VenueWorkspace })));

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="eyebrow">DRT VENUE TWIN</span>
      <strong>Loading planning model…</strong>
    </div>
  );
}

function VenueRoute() {
  const { slug } = useParams();
  const venue = slug ? venueMap[slug] : undefined;
  if (!venue) return <Navigate to="/" replace />;
  return <VenueWorkspace venue={venue} />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compare" element={<Comparison />} />
        <Route path="/venues/:slug" element={<VenueRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
