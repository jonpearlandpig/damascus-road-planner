import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/VenueScene', () => ({
  VenueScene: ({ venue, onAction }: { venue: { name: string }; onAction: (action: { type: string; id?: string }) => void }) => (
    <button type="button" onClick={() => onAction({ type: 'selectObject', id: 'venue-floor' })}>
      Scene mock for {venue.name}
    </button>
  ),
}));

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App route smoke coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the route control room dashboard', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Venue Twin Control Room' })).toBeInTheDocument();
    expect(screen.getByText('19 venue records')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '19-show source status' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '19-show source completion matrix' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Venue source review approvals' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Venue source review approval matrix' })).toBeInTheDocument();
    expect(screen.getByText('90 approved')).toBeInTheDocument();
    expect(screen.getAllByText('Spectrum Center').length).toBeGreaterThan(0);
    expect(screen.getByText('Playoff Contingency — Venue TBD')).toBeInTheDocument();
  });

  it('renders the comparison view with meaningful venue data', async () => {
    renderRoute('/compare');

    expect(await screen.findByRole('heading', { name: 'Strongest venue comparison' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'End-stage rigging' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dickies Arena/ })).toBeInTheDocument();
  });

  it('renders a venue workspace with a safe unselected, locked production seed', async () => {
    renderRoute('/venues/spectrum-center');

    expect(await screen.findByRole('heading', { name: 'Spectrum Center' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scene mock for Spectrum Center' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No object selected' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Scene hierarchy'));
    const bStageNode = screen.getByRole('button', { name: /DRT B stage.*locked/i });
    fireEvent.click(bStageNode);
    expect(screen.getAllByRole('heading', { name: 'DRT B stage' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Locked. Unlock deliberately before transforming.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle measurement tool' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save scene locally' })).toBeEnabled();
  });

  it('falls back to the dashboard for an unknown venue', async () => {
    renderRoute('/venues/not-a-real-venue');

    expect(await screen.findByRole('heading', { name: 'Venue Twin Control Room' })).toBeInTheDocument();
  });
});
