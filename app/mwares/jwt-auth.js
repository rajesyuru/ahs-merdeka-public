const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtAuth = (req, res, next) => {
    if (req.headers.authorization) {
        const headerAuth = req.headers.authorization.split(' ');
        if (headerAuth.length === 2) {
            const token = headerAuth[1];

            try {
                const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

                req.authUser = payload;
            } catch (e) {
                console.log('error', e);

                res.status(401).send({
                    status: 'error',
                    message: e.message
                });
            }
        } else {
            res.status(401).send({
                status: 'error',
                message: 'Invalid authorization header'
            });
        }
    } else {
        res.status(401).send({
            status: 'error',
            message: 'Need authorization header'
        });
    }

    next();
};

module.exports = jwtAuth;
