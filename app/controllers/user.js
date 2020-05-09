const {Op, User, Merchant} = require('../models');
const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
const {canEdit} = require('../permissions/user');

exports.users = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const merchant_id = req.authUser.merchant_id;

    let count = await User.count({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
            merchant_id: merchant_id || {[Op.or]: [{[Op.gt]: 0}, null]}
        }
    });
    let users = await User.findAll({
        attributes: [
            'id',
            'name',
            'email',
            'created_at',
            'updated_at'
        ],
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
            merchant_id: merchant_id || {[Op.or]: [{[Op.gt]: 0}, null]}
        },
        include: ['group', 'merchant'],
        order: [
            ['created_at', 'asc']
        ],
        limit: limit,
        offset: offset,
    });

    res.send({
        status: 'success',
        totalData: count,
        totalPage: Math.ceil(count / limit),
        page: page,
        data: users
    });
};

exports.edit = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string(),
        email: Joi.string(),
        password: Joi.string(),
        group_id: Joi.number().integer(),
    });

    const {error} = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message
        })
    };

    const name = req.body.name || '';
    const email = req.body.email || '';
    const password = req.body.password || '';
    const group_id = req.body.group_id || 0;

    const id = req.params.user_id;

    const user = await User.findByPk(id);

    // console.log(currentMerchant, user.merchant_id);

    if (!user) {
        return res.status(400).send({
            status: 'error',
            message: 'User not found'
        });
    };

    if (!canEdit(req.authUser, user)) {
        return res.status(403)
            .send('Forbidden');
    }

    if (name.length > 0) {
        user.name = name;
    }
    if (email.length > 0) {
        user.email = email;
    }
    if (password.length > 0) {
        user.password = bcrypt.hashSync(password, 8);
    }
    if (group_id > 0) {
        user.group_id = group_id;
    }
    user.save();

    res.send({
        status: 'success',
        data: {
            name: user.name,
            email: user.email,
            group_id: user.group_id,
            merchant_id: user.merchant_id,
        },
    })
}
