const { Merchant, Op } = require('../models');
const Joi = require('@hapi/joi');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        name: Joi.string(),
    });

    let limit = 20;

    if (!req.query.limit) {
        const dataCount = await Merchant.count();

        if (dataCount) {
            limit = dataCount;
        }
    } else {
        limit = req.query.limit * 1;
    }

    const page = req.query.page * 1 || 1;
    const offset = (page - 1) * limit;
    const nameSearch = req.query.name || '';

    const { count, rows } = await Merchant.findAndCountAll({
        where: {
            name: {
                [Op.iLike]: `%${nameSearch}%`,
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
        data: rows,
    });
};

exports.add = async (req, res) => {
    const name = req.body.name;

    const findMerchants = await Merchant.findOne({
        where: {
            name: {
                [Op.iLike]: `%${name}%`,
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
