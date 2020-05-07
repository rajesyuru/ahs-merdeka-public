const {Op, User, Merchant} = require('../models');
const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');

exports.users = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const merchant_id = req.authUser.merchant_id;

    // let count = await User.count({
    //     where: {
    //         name: {
    //             [Op.iLike]: `%${search}%`,
    //         },
    //         [Op.any]: {
    //             merchant_id
    //         }
    //     },
    // });
    // let users = await User.findAll({
    //     attributes: [
    //         'name',
    //         'email',
    //         'created_at',
    //         'updated_at'
    //     ],
    //     where: {
    //         name: {
    //             [Op.iLike]: `%${search}%`,
    //         },
    //     },
    //     include: ['group', 'merchant'],
    //     order: [
    //         ['created_at', 'asc']
    //     ],
    //     limit: limit,
    //     offset: offset,
    // });
    // res.send({
    //     status: 'success',
    //     totalData: count,
    //     totalPage: Math.ceil(count / limit),
    //     page: page,
    //     data: users
    // });

    let count;
    let users;

    if (!merchant_id) {
        count = await User.count({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
            },
        });
        users = await User.findAll({
            attributes: [
                'name',
                'email',
                'created_at',
                'updated_at'
            ],
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
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
    } else {
        count = await User.count({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
                merchant_id: merchant_id
            },
        });
        users = await User.findAll({
            attributes: [
                'name',
                'email',
                'created_at',
                'updated_at'
            ],
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
                merchant_id: merchant_id
            },
            include: ['group'],
            order: [
                ['created_at', 'asc']
            ],
            limit: limit,
            offset: offset,
        });
        const merchant = await Merchant.findByPk(merchant_id);
        res.send({
            status: 'success',
            totalData: count,
            totalPage: Math.ceil(count / limit),
            page: page,
            merchant: merchant,
            data: users
        });
    };
};

exports.edit = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
        group_id: Joi.number().integer().required(),
        merchant_id: Joi.number().integer().required()
    });

    const {error} = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message
        })
    };

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const group_id = req.body.group_id;
    const merchant_id = req.body.merchant_id;

    const id = req.params.user_id;

    const user = await User.findByPk(id);

    const currentMerchant = req.authUser.merchant_id;

    // console.log(currentMerchant, user.merchant_id);

    if (!user) {
        return res.status(400).send({
            status: 'error',
            message: 'User not found'
        });
    };

    if (currentMerchant !== null) {
        if (currentMerchant !== user.merchant_id) {
            return res.status(403)
                .send('Forbidden');
        };
    };

    user.name = name;
    user.email = email;
    user.password = bcrypt.hashSync(password, 8);
    user.group_id = group_id;
    if (user.merchant_id !== null) {
        user.merchant_id = merchant_id;
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
