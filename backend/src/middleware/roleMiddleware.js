const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before checking roles.'
      });
    }

    // Flatten in case array was passed as single argument
    const flattenedRoles = allowedRoles.flat();

    if (!flattenedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Forbidden: Requires one of [${flattenedRoles.join(', ')}] role. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
