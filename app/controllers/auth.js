const bcrypt = require('bcrypt');
const { User } = require('../models');

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
            res.send({
                status: 'success'
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