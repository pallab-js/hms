import { render, screen } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AppShell', () => {
  it('renders the brand title', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText('HMS')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });
});