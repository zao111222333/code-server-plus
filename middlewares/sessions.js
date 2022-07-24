module.exports = (req, res, next) => {
    if (!req.app.sessions) req.app.sessions = {};
    if (req.session.login) req.app.sessions[req.sessionID] = req.session;
    next();
}