import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AuthForm from './AuthForm';

const defaultProps = {
  isRegister: false,
  form: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  onChange: vi.fn(),
  onSubmit: vi.fn((event) => event.preventDefault()),
  onForgotPassword: vi.fn(),
  isSubmitting: false,
  error: '',
  message: '',
  submitLabel: 'Log in',
};

describe('AuthForm', () => {
  it('renders login fields and submits the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('First name')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders registration-only fields', () => {
    render(
      <AuthForm
        {...defaultProps}
        isRegister
        submitLabel="Create account"
      />
    );

    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('displays errors and disables submission while submitting', () => {
    render(
      <AuthForm
        {...defaultProps}
        error="Invalid credentials"
        isSubmitting
      />
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
  });
});
