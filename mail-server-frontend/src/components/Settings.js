import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Settings = () => {
  const { user, API_BASE_URL, token } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailChangeForm, setEmailChangeForm] = useState({
    newEmail: '',
  });
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', error);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!emailChangeForm.newEmail) {
      setError('Please enter a new email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/settings/change-primary-email`,
        { newEmail: emailChangeForm.newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfirmationToken(response.data.confirmationToken);
      setConfirmationDialog(true);
      setSuccess('Email change requested. Please confirm using the token below.');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to request email change');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_BASE_URL}/api/settings/confirm-email-change`,
        { confirmationToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Primary email updated successfully!');
      setConfirmationDialog(false);
      setEmailChangeForm({ newEmail: '' });
      setConfirmationToken('');
      fetchSettings(); // Refresh settings
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to confirm email change');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading settings...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SettingsIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Account Settings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Account Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Email Settings
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Account Email (Login)
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {settings.accountEmail}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This is your login email and cannot be changed
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Primary Email (Forwarding)
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {settings.primaryEmail}
                </Typography>
                <VerifiedIcon color="success" fontSize="small" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Where your emails are forwarded to
              </Typography>
            </Box>

            {settings.pendingEmailChange && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Pending email change to: {settings.pendingEmailChange}
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Change Primary Email
            </Typography>
            
            <Box display="flex" gap={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                label="New Primary Email"
                type="email"
                value={emailChangeForm.newEmail}
                onChange={(e) => setEmailChangeForm({ newEmail: e.target.value })}
                placeholder="new-email@gmail.com"
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleRequestEmailChange}
                disabled={loading || !emailChangeForm.newEmail}
              >
                {loading ? 'Requesting...' : 'Request Change'}
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Note: You cannot use estrogen.email or blahaj.email domains as your primary email
            </Typography>
          </CardContent>
        </Card>

        {/* Account Tier Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Account Plan
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <Chip
                label={settings.tierInfo.name}
                color={settings.accountTier === 'standard' ? 'default' : 'primary'}
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                {settings.tierInfo.price}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Features:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <Typography variant="body2">
                  {settings.tierInfo.limit === -1 ? 'Unlimited' : settings.tierInfo.limit} email aliases
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Aliases on estrogen.email and blahaj.email domains
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Protected from reserved prefixes (admin, support, no-reply, etc.)
                </Typography>
              </li>
            </ul>
          </CardContent>
        </Card>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog} onClose={() => setConfirmationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Email Change</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            In a real application, this confirmation would be sent to your new email address.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please confirm your email change by using the token below:
          </Typography>
          <TextField
            label="Confirmation Token"
            value={confirmationToken}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            sx={{ mb: 2 }}
            InputProps={{ readOnly: true }}
          />
          <Typography variant="caption" color="text.secondary">
            Click "Confirm Change" to complete the email update.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmEmailChange} variant="contained" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm Change'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
