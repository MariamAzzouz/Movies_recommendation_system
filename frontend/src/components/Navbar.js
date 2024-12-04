import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import './Navbar.css';

const Navbar = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if user is logged in on component mount
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // You can decode the JWT token to get username if stored there
      // or make an API call to get user details
      setUsername(localStorage.getItem('username') || 'User');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a237e' }}>
      <Toolbar>
        <IconButton edge="start" color="inherit">
          <MovieIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Movie Recommender
        </Typography>
        
        <div className="navbar-center">
          <Link to="/movies">ALL MOVIES</Link>
          <Link to="/recommendations">RECOMMENDATIONS</Link>
          <Link to="/favorites">FAVORITES</Link>
        </div>

        {children}

        <div className="navbar-right">
          {!isLoggedIn ? (
            <div className="auth-buttons">
              <button onClick={() => navigate('/login')} className="login-btn">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="register-btn">
                Register
              </button>
            </div>
          ) : (
            <div className="user-menu">
              <span className="username">Welcome, {username}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 