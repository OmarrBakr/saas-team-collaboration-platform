import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { updateCurrentUser, updatePassword } from '../services/user';
import '../styles/auth.css';

const nameFormInitial = {
  firstName: '',
  lastName: '',
  email: '',
};

const passwordFormInitial = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [nameForm, setNameForm] = useState(nameFormInitial);
  const [passwordForm, setPasswordForm] = useState(passwordFormInitial);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    setNameForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
    });
  }, [user]);

  const hasNameChanges =
    user &&
    (nameForm.firstName.trim() !== (user.firstName || '').trim() ||
      nameForm.lastName.trim() !== (user.lastName || '').trim());

  const hasCompletePasswordForm = Object.values(passwordForm).every((value) =>
    value.trim()
  );

  const handleNameChange = (event) => {
    const { name, value } = event.target;
    setNameForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();
    setNameError('');
    setNameMessage('');

    if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
      setNameError('First name and last name are required.');
      return;
    }

    if (!hasNameChanges) return;

    setSavingName(true);

    try {
      const result = await updateCurrentUser({
        firstName: nameForm.firstName.trim(),
        lastName: nameForm.lastName.trim(),
      });

      setUser(result.user);
      setNameMessage('Profile updated successfully.');
    } catch (err) {
      setNameError(err.message || 'Something went wrong');
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in both password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(passwordFormInitial);
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      setPasswordError(err.message || 'Something went wrong');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="profile-shell">
      <section className="profile-card auth-card">
        <header className="profile-header profile-header--compact">
          <div className="profile-title">
            <span className="workspace-card-logo user-avatar profile-avatar" aria-hidden="true">
              <span className="workspace-logo-fallback user-avatar-text">
                {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.trim() || 'U'}
              </span>
            </span>
            <div>
              <p className="panel-label">Profile</p>
              <h1>Account settings</h1>
            </div>
          </div>

          <button type="button" className="back-link profile-back-button" onClick={() => navigate(-1)}>
            Back
          </button>
        </header>

        <div className="profile-section">
          <div className="panel-head">
            <div>
              <p className="panel-label">Details</p>
              <h2>Personal information</h2>
            </div>
          </div>

          <form className="auth-form profile-form" onSubmit={handleNameSubmit} noValidate>
            <div className="two-up">
              <label>
                <span>First name</span>
                <input
                  name="firstName"
                  value={nameForm.firstName}
                  onChange={handleNameChange}
                  placeholder="First name"
                  required
                />
              </label>

              <label>
                <span>Last name</span>
                <input
                  name="lastName"
                  value={nameForm.lastName}
                  onChange={handleNameChange}
                  placeholder="Last name"
                  required
                />
              </label>
            </div>

            <label>
              <span>Email</span>
              <input value={nameForm.email} readOnly />
            </label>

            {nameError && <div className="status-message error">{nameError}</div>}
            {nameMessage && <div className="status-message success">{nameMessage}</div>}

            <button
              type="submit"
              className="primary-btn profile-submit"
              disabled={savingName || !hasNameChanges}
            >
              {savingName ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="profile-section profile-divider">
          <div className="panel-head">
            <div>
              <p className="panel-label">Security</p>
              <h2>Password</h2>
            </div>
          </div>

          <form className="auth-form profile-form" onSubmit={handlePasswordSubmit} noValidate>
            <label>
              <span>Current password</span>
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Current password"
                autoComplete="current-password"
                required
              />
            </label>

            <div className="two-up">
              <label>
                <span>New password</span>
                <input
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New password"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                <span>Confirm password</span>
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                />
              </label>
            </div>

            {passwordError && <div className="status-message error">{passwordError}</div>}
            {passwordMessage && <div className="status-message success">{passwordMessage}</div>}

            <button
              type="submit"
              className="primary-btn profile-submit"
              disabled={savingPassword || !hasCompletePasswordForm}
            >
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
