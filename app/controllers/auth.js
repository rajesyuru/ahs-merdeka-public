const bcrypt = require('bcrypt');
const { User } = require('../models');

require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const email = req.body.email || '';
    const password = req.body.password || '';

    const user = await User.findOne({
        where: {
            email: email,
        },
    });

    if ( user ) {
        if (bcrypt.compareSync(password, user.password)) {
            const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at
            };
            const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET);
            res.send({
                status: 'success',
                token: token
            });
        } else {
            res.status(400).send({
                status: 'error',
                message: 'Password incorrect'
            });
        }
    } else {
        res.status(400).send({
            status: 'error',
            message: 'Email not found'
        });
    }
};

exports.me = (req, res) => {
    res.send({
        status: 'success',
        data: req.authUser
    });
};