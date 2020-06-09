const { Product, Op } = require('../models');
const Joi = require('@hapi/joi');

const { canEdit } = require('../permissions/product');

exports.fetch = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const merchant_id = req.authUser.merchant_id;

    // console.log(merchant_id);

    let count;
    let products;

    const prodSort = [['updated_at', 'desc']]

    if (merchant_id === null) {
        count = await Product.count({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
            },
        });

        products = await Product.findAll({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
            },
            order: prodSort,
            include: ['owner'],
            limit: limit,
            offset: offset,
        });
    } else {
        count = await Product.count({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
                merchant_id: merchant_id,
            },
        });

        products = await Product.findAll({
            where: {
                name: {
                    [Op.iLike]: `%${search}%`,
                },
                merchant_id: merchant_id,
            },
            order: prodSort,
            include: ['owner'],
            limit: limit,
            offset: offset,
        });
    }

    res.send({
        status: 'success',
        totalData: count,
        totalPage: Math.ceil(count / limit),
        page: page,
        data: products,
    });
};

exports.add = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required(),
        image: Joi.string(),
    });

    const merchant_id = req.authUser.merchant_id;

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const price = req.body.price;
    const image = req.body.image || '';

    const data = await Product.create({
        name,
        price,
        image,
        merchant_id: merchant_id * 1,
    });

    res.send({
        status: 'success',
        data: data,
    });
};

exports.edit = async (req, res) => {
    const product_id = req.params.product_id;

    const product = await Product.findOne({
        where: {
            id: product_id,
        },
    });

    if (!product) {
        return res.status(400).send({
            status: 'error',
            message: 'Product not found',
        });
    }

    const schema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const price = req.body.price;

    product.name = name;
    product.price = price;
    product.save();

    res.send({
        status: 'success',
        data: product,
    });
};
