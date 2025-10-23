// Authentication middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    
    return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
    });
};

// Middleware to check if user is not authenticated (for login/register routes)
const isNotAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    
    return res.status(400).json({
        error: 'Already authenticated',
        message: 'User is already logged in'
    });
};

// Middleware to optionally authenticate (doesn't block if not authenticated)
const optionalAuth = (req, res, next) => {
    // Always proceed, but req.user will be available if authenticated
    next();
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    optionalAuth
};
