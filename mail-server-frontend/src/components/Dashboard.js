import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  ForwardToInbox,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, API_BASE_URL, token } = useAuth();
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({
    totalEmails: 0,
    emailAccount: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [newEmail, setNewEmail] = useState({
    emailAddress: '',
  });
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEmails();
    fetchAccountInfo();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccountInfo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/account-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch account info:', error);
    }
  };

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/emails`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmails(response.data);
      setStats({
        totalEmails: response.data.length,
        emailAccount: user?.email || '',
      });
    } catch (error) {
      console.error('Failed to fetch email addresses:', error);
      setError('Failed to load email addresses');
    }
  };

  const handleCreateEmail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/api/emails`, newEmail, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Email address created successfully!');
      setNewEmail({ emailAddress: '' });
      setOpenDialog(false);
      fetchEmails();
      fetchAccountInfo();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create email address');
    }

    setLoading(false);
  };

  const handleDeleteEmail = async (id) => {
    if (window.confirm('Are you sure you want to delete this email address?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/emails/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Email address deleted successfully!');
        fetchEmails();
        fetchAccountInfo();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete email address');
      }
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              color: 'white',
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            <Typography color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Email Management Dashboard
      </Typography>
      
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Welcome back, {user?.username}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Email Addresses"
            value={`${stats.totalEmails}${accountInfo ? `/${accountInfo.tierInfo.emailLimit === -1 ? '∞' : accountInfo.tierInfo.emailLimit}` : ''}`}
            icon={<ForwardToInbox />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Primary Email"
            value="Active"
            icon={<EmailIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Account Plan"
            value={accountInfo?.tierInfo?.name || 'Standard'}
            icon={<PersonIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Plan Price"
            value={accountInfo?.tierInfo?.price || 'Free'}
            icon={<PersonIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Recent Email Addresses
          </Typography>
          <Chip
            label={`Primary: ${stats.emailAccount}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {emails.length > 0 ? (
          <List>
            {emails.slice(0, 5).map((email) => (
              <ListItem key={email.id} divider>
                <ListItemText
                  primary={`${email.email_address} → ${email.forward_to || user?.primaryEmail || 'Primary email'}`}
                  secondary={`Created: ${new Date(email.created_at).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteEmail(email.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              No email addresses created yet. Click the + button to create your first address!
            </Typography>
          </Box>
        )}
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Email Address</DialogTitle>
        <DialogContent>
          {accountInfo && !accountInfo.canCreateMore && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You've reached your email address limit ({accountInfo.tierInfo.emailLimit}) for the {accountInfo.tierInfo.name} plan.
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 2 }}>
            Your primary email: <strong>{user?.email}</strong>
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            id="emailAddress"
            label="New Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newEmail.emailAddress}
            onChange={(e) => setNewEmail({ ...newEmail, emailAddress: e.target.value })}
            helperText="Create a custom email address (e.g. work@estrogen.email, hello@blahaj.email). It will forward to your primary email by default."
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Your new email address will forward to your primary email address by default. You can change the forwarding destination after creation in the Email Addresses page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateEmail}
            variant="contained"
            disabled={loading || !newEmail.emailAddress || (accountInfo && !accountInfo.canCreateMore)}
          >
            {loading ? 'Creating...' : 'Create Email Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
