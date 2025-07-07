import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const { register, API_BASE_URL } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    domain: '',
    password: '',
    confirmPassword: '',
    personalEmail: '',
  });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available domains
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/domains`);
        setDomains(response.data);
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      }
    };

    fetchDomains();
  }, [API_BASE_URL]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register(formData.username, formData.domain, formData.password, formData.personalEmail);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              helperText="This will be the part before @ in your email"
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="domain-label">Domain</InputLabel>
              <Select
                labelId="domain-label"
                id="domain"
                name="domain"
                value={formData.domain}
                label="Domain"
                onChange={handleChange}
              >
                {domains.map((domain) => (
                  <MenuItem key={domain} value={domain}>
                    {domain}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.username && formData.domain && (
              <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                Your email will be: <strong>{formData.username}@{formData.domain}</strong>
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="personalEmail"
              label="Your Personal Email"
              name="personalEmail"
              type="email"
              autoComplete="email"
              value={formData.personalEmail}
              onChange={handleChange}
              helperText="Where emails will be forwarded to (cannot be estrogen.email or blahaj.email)"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                type="button"
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
