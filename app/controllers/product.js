const { Product, Op, Transaction } = require('../models');
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
    const schema = Joi.object({
        name: Joi.string(),
        price: Joi.number(),
        buying_price: Joi.number(),
        image: Joi.string(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

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

    if (!canEdit(req.authUser, product)) {
        return res.status(403).send('Forbidden');
    }

    const name = req.body.name;
    const price = req.body.price;
    const buying_price = req.body.buying_price;
    const image = req.body.image;

    if (name) {
        product.name = name;
    }
    if (price) {
        product.price = price;
    }
    if (buying_price) {
        product.buying_price = buying_price;
    }
    if (image) {
        product.image = image;
    }
    product.save();

    res.send({
        status: 'success',
        data: product,
    });
};

exports.fetchStocks = async (req, res) => {
    const merchant_id = req.authUser.merchant_id;

    const products = await Product.findAll({
        where: {
            merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
        },
    });

    if (!products > 0) {
        return res.status(400).send({
            status: 'error',
            message: 'Product not found',
        });
    }

    let data = [];

    products.forEach(async ({ id, name, price, buying_price, merchant_id }) => {
        const buys = await Transaction.findAll({
            where: {
                product_id: id,
                type: 'buy',
            },
        });

        const sells = await Transaction.findAll({
            where: {
                product_id: id,
                type: 'sell',
            },
        });

        const buysSum = buys
            .map((buy) => buy.quantity)
            .reduce((a, b) => a + b, 0);
        const sellsSum = sells
            .map((sell) => sell.quantity)
            .reduce((a, b) => a + b, 0);

        data.push({
            product_id: id,
            name: name,
            price: price,
            buying_price: buying_price,
            merchant_id: merchant_id,
            stock: buysSum - sellsSum,
        });

        if (data.length === products.length) {
            return res.send({
                status: 'success',
                data,
            });
        }
    });
};

exports.delete = async (req, res) => {
    const product_id = req.params.product_id;

    const product = await Product.findByPk(product_id);

    if (!product) {
        return res.status(400).send({
            status: 'error',
            message: 'Product not found',
        });
    }

    if (!canEdit(req.authUser, product)) {
        return res.status(403).send('Forbidden');
    }

    product.destroy();

    res.send({
        status: 'success',
        data: product,
    });
};

exports.stock = async (req, res) => {
    const id = req.params.product_id;

    const product = await Product.findByPk(id);

    if (!product) {
        return res.status(400).send({
            status: 'error',
            message: 'Product not found',
        });
    }

    if (!canEdit(req.authUser, product)) {
        return res.status(403).send('Forbidden');
    }

    const { rows, count } = await Transaction.findAndCountAll({
        where: {
            product_id: product.id,
        },
        order: [['date', 'desc']],
    });

    if (count === 0) {
        res.status(400).send({
            status: 'error',
            message: 'Transaction not found',
        });
    }

    res.send({
        status: 'success',
        totalData: count,
        data: rows,
    });
};
