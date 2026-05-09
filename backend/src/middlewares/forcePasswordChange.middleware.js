const forcePasswordChangeMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.',
        });
    }

    const allowedPaths = [
        '/api/auth/me',
        '/api/auth/change-password',
        '/api/auth/logout',
    ];

    if (req.user.mustChangePassword && !allowedPaths.includes(req.originalUrl)) {
        return res.status(403).json({
            success: false,
            message: 'You must change your temporary password before accessing the system.',
            code: 'PASSWORD_CHANGE_REQUIRED',
        });
    }

    next();
};

module.exports = forcePasswordChangeMiddleware;