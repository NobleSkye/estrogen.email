import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Email as EmailIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  ForwardToInbox,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static">
      <Toolbar>
        <EmailIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Email Management System
        </Typography>
        
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{
                mr: 1,
                backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<ForwardToInbox />}
              onClick={() => navigate('/emails')}
              sx={{
                mr: 1,
                backgroundColor: isActive('/emails') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              Email Addresses
            </Button>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
            <Typography variant="body2" sx={{ ml: 2 }}>
              {user.email}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
