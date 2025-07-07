import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Fab,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ForwardToInbox,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EmailAddresses = () => {
  const { user, API_BASE_URL, token } = useAuth();
  const [emails, setEmails] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    emailAddress: '',
  });
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editForwardingDialog, setEditForwardingDialog] = useState(false);
  const [editingForwardingEmail, setEditingForwardingEmail] = useState(null);
  const [forwardingForm, setForwardingForm] = useState({
    forwardTo: '',
  });

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
    } catch (error) {
      console.error('Failed to fetch email addresses:', error);
      setError('Failed to load email addresses');
    }
  };

  const handleOpenDialog = (email = null) => {
    setEmailForm({
      emailAddress: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEmailForm({
      emailAddress: '',
    });
    setError('');
  };

  const handleSaveEmail = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/api/emails`, emailForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Email address created successfully!');
      handleCloseDialog();
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

  const handleEditForwarding = (email) => {
    setEditingForwardingEmail(email);
    setForwardingForm({
      forwardTo: email.forward_to || '',
    });
    setEditForwardingDialog(true);
  };

  const handleUpdateForwarding = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(
        `${API_BASE_URL}/api/emails/${editingForwardingEmail.id}/forwarding`,
        { forwardTo: forwardingForm.forwardTo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Forwarding destination updated successfully!');
      setEditForwardingDialog(false);
      fetchEmails();
      fetchAccountInfo();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update forwarding');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Email Addresses
        </Typography>
        <Chip
          icon={<ForwardToInbox />}
          label={`${emails.length} addresses`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Create custom email addresses using estrogen.email or blahaj.email that forward to your personal email. Perfect for privacy and organization!
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

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Email Address</TableCell>
                <TableCell>Forwards To</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emails
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((email) => (
                <TableRow key={email.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {email.email_address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {email.forward_to || user?.primaryEmail || 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={email.is_active ? 'Active' : 'Inactive'}
                      color={email.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(email.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditForwarding(email)}
                      color="primary"
                      title="Edit Forwarding"
                    >
                      <ForwardToInbox />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEmail(email.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {emails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No email addresses found. Create your first address to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={emails.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Email Address
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {accountInfo && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Plan: <strong>{accountInfo.tierInfo.name}</strong> | 
                Email Addresses: <strong>{accountInfo.currentEmails}/{accountInfo.tierInfo.emailLimit === -1 ? '∞' : accountInfo.tierInfo.emailLimit}</strong>
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              id="emailAddress"
              label="New Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={emailForm.emailAddress}
              onChange={(e) => setEmailForm({ ...emailForm, emailAddress: e.target.value })}
              helperText="Create a custom email address (e.g. work@estrogen.email, hello@blahaj.email). Reserved prefixes like admin, support, no-reply are blocked."
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Your new email address will forward to your primary email address ({user?.primaryEmail || 'your account email'}) by default. You can change the forwarding destination after creation.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveEmail}
            variant="contained"
            disabled={loading || !emailForm.emailAddress || (accountInfo && !accountInfo.canCreateMore)}
          >
            {loading ? 'Creating...' : 'Create Email Address'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Forwarding Dialog */}
      <Dialog open={editForwardingDialog} onClose={() => setEditForwardingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Forwarding Destination
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Email Address: <strong>{editingForwardingEmail?.email_address}</strong>
            </Typography>
            
            <TextField
              margin="dense"
              id="editForwardTo"
              label="Forward To (Personal Email)"
              type="email"
              fullWidth
              variant="outlined"
              value={forwardingForm.forwardTo}
              onChange={(e) => setForwardingForm({ forwardTo: e.target.value })}
              helperText={`Leave blank to use your primary email (${user?.primaryEmail || 'your account email'})`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditForwardingDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateForwarding}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Forwarding'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmailAddresses;
