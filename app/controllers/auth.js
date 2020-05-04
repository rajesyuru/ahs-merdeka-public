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
            const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: process.env.TOKEN_LIFE_TIME * 1
            });
            const refreshToken =jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: '7d'
            });
            res.send({
                status: 'success',
                token: token,
                refreshToken: refreshToken
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

exports.refreshToken = async (req, res) => {
    const payload = req.authUser;
    delete payload.exp;
    delete payload.iat;
    console.log(process.env.TOKEN_LIFE_TIME);
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.TOKEN_LIFE_TIME * 1
    });

    res.send({
        status: 'success',
        token: token
    });
};


exports.me = (req, res) => {
    res.send({
        status: 'success',
        data: req.authUser
    });
};

exports.register = async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const group_id = req.body.group_id || null;
    const merchant_id = req.body.merchant_id || null;

    const doesEmailExist = await User.findOne({
        where: {
            email: email
        }
    });

    // console.log(merchant_id)

    if (!doesEmailExist) {
        const user = await User.create({
            name: name,
            email: email,
            password: bcrypt.hashSync(password, 8),
            group_id: group_id,
            merchant_id: merchant_id
        });
    
        res.send({
            status: 'success',
            data: {
                name: user.name,
                email: user.email,
                group_id: user.group_id,
                merchant_id: user.merchant_id,
            },
        });
    } else {
        res.send({
            status: 'error',
            message: 'Email telah dipakai'
        })
    }    
}