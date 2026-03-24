import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleSelector from './RoleSelector.jsx';

describe('RoleSelector', () => {
  it('renders all role options', () => {
    render(<RoleSelector onSelect={() => {}} />);
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('UX')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('calls onSelect with chosen role', async () => {
    const onSelect = vi.fn();
    render(<RoleSelector onSelect={onSelect} />);
    await userEvent.click(screen.getByText('Dev'));
    expect(onSelect).toHaveBeenCalledWith('Dev');
  });
});
