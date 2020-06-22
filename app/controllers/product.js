const { Product, Op } = require('../models');
const Joi = require('@hapi/joi');

const { canEdit } = require('../permissions/product');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number().integer(),
        limit: Joi.number().integer(),
        id: Joi.number(),
        name: Joi.string(),
    });

    const { error } = schema.validate(req.query);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const offset = (page - 1) * limit;
    const idSearch = req.query.id * 1 || null;
    const nameSearch = req.query.name || '';

    const merchant_id = req.authUser.merchant_id;

    const { count, rows } = await Product.findAndCountAll({
        where: {
            id:
                idSearch && !merchant_id
                    ? {
                          [Op.eq]: idSearch,
                      }
                    : {
                          [Op.not]: null,
                      },
            name: {
                [Op.iLike]: `%${nameSearch}%`,
            },
            merchant_id: merchant_id
                ? merchant_id
                : {
                      [Op.not]: null,
                  },
        },
        order: [['updated_at', 'desc']],
        include: ['owner'],
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
    const schema = Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required(),
        buying_price: Joi.number().required(),
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
    const buying_price = req.body.buying_price;
    const image = req.body.image || '';

    const data = await Product.create({
        name,
        price,
        image,
        merchant_id: merchant_id * 1,
        buying_price,
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
        buying_price: Joi.number().required(),
        image: Joi.string(),
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
    const buying_price = req.body.buying_price;
    const image = req.body.image || '';

    product.name = name;
    product.price = price;
    product.buying_price = buying_price;
    if (image.length > 0) {
        product.image = image;
    }
    product.save();

    res.send({
        status: 'success',
        data: product,
    });
};
