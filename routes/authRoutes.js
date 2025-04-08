const express = require('express');
const passport = require('passport');
const router = express.Router();

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Initiate Google Sign-In
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Sign-In Callback
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }), // Redirect on failure
  (req, res) => {
    // Successful authentication, redirect to the dashboard
    res.redirect('/dashboard');
  }
);

// Logout route (optional)
router.get('/logout', (req, res) => {
  req.logout(function(err) { // Passport 0.6+ uses req.logout({ keepSessionInfo: false }, ...)
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Dashboard route (for testing successful login)
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.send(`<h1>Dashboard</h1><p>Welcome, ${req.user.displayName || 'User'}!</p><a href="/logout">Logout</a>`);
});

module.exports = { router, ensureAuthenticated };