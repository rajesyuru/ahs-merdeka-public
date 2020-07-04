const { Merchant, Op } = require('../models');

exports.fetch = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const count = await Merchant.count({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
    });

    const merchants = await Merchant.findAll({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
        limit: limit,
        offset: offset,
    });

    res.send({
        status: 'success',
        totalData: count,
        totalPage: Math.ceil(count / limit),
        page: page,
        data: merchants,
    });
};

exports.add = async (req, res) => {
    const name = req.body.name;

    const findMerchants = await Merchant.findOne({
        where: {
            name: {
                [Op.iLike]: `%${name}%`
            },
        },
    });

    if (findMerchants) {
        return res.status(400).send({
            status: 'error',
            message: 'Merchant already exists',
        });
    }

    const merchant = await Merchant.create({
        name: name,
    });

    res.send({
        status: 'success',
        data: merchant,
    });
};
