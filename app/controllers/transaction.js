const { Transaction, Op, Product, Customer } = require('../models');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { modifyAccess } = require('../permissions/transaction');
const { canEdit } = require('../permissions/customer');
const moment = require('moment');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        id: Joi.number(),
        date: Joi.date().format('YYYY-MM-DD'),
        product_id: Joi.number(),
        type: Joi.string(),
        info: Joi.string(),
        sort: Joi.string(),
    });

    const { error } = schema.validate(req.query);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const merchant_id = req.authUser.merchant_id;

    const page = req.query.page * 1 || 1;
    const idSearch = req.query.id * 1 || null;
    const dateSearch = req.query.date;
    const productSearch = req.query.product_id * 1 || null;
    const typeSearch = req.query.search;
    const infoSearch = req.query.info || '';

    let sortBy = [['updated_at', 'desc']];
    const querysortBy = req.query.sort;

    if (querysortBy) {
        const sortCat = querysortBy.split('-');
        if (sortCat.length !== 2) {
            return res.status(400).send({
                status: 'error',
                message: 'Sort format is wrong',
            });
        }
        sortBy = [[sortCat[0], sortCat[1]]];
    }

    let limit = req.query.limit * 1;

    if (!limit) {
        limit = await Transaction.count({
            where: {
                merchant_id: merchant_id || { [Op.not]: null },
            },
            attributes: { exclude: ['MerchantId'] },
        });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
        where: {
            id: idSearch || { [Op.not]: null },
            date: dateSearch ? new Date(dateSearch) : { [Op.not]: null },
            product_id: productSearch || { [Op.gt]: 0 },
            type: typeSearch
                ? {
                      [Op.iLike]: `%${typeSearch}%`,
                  }
                : {
                      [Op.not]: null,
                  },
            info: infoSearch
                ? {
                      [Op.iLike]: `%${infoSearch}%`,
                  }
                : {
                      [Op.or]: {
                          [Op.iLike]: `%%`,
                          [Op.is]: null,
                      },
                  },
            merchant_id: merchant_id || { [Op.not]: null },
        },
        include: ['product', 'customer'],
        order: sortBy,
        limit: limit,
        offset: offset,
        attributes: { exclude: ['MerchantId', 'gallon_id'] },
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
        date: Joi.date().format('YYYY-MM-DD').required(),
        product_id: Joi.number().required(),
        type: Joi.string().required(),
        quantity: Joi.number().required(),
        info: Joi.string().allow(null),
        customer_id: Joi.number().allow(null),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const date = req.body.date;
    const id = req.body.product_id;
    const type = req.body.type;
    const quantity = req.body.quantity;
    const info = req.body.info;
    const customer_id = req.body.customer_id;

    if (type === 'sell' && !customer_id) {
        return res.status(400).send({
            status: 'error',
            message: 'customer_id is required if the type is sell',
        });
    } else if (type === 'buy' && customer_id) {
        return res.status(400).send({
            status: 'error',
            message: 'customer_id is not required if the type is buy',
        });
    }

    if (customer_id) {
        const customer = await Customer.findByPk(customer_id);

        if (!customer) {
            return res.status(400).send({
                status: 'error',
                message: 'Customer not found',
            });
        }
    }

    const product = await Product.findOne({
        where: {
            id,
            merchant_id: req.authUser.merchant_id,
        },
    });

    if (!product) {
        return res.status(400).send({
            status: 'error',
            message: 'Product not found',
        });
    }

    if (!modifyAccess(req.authUser, product)) {
        return res.status(401).send({
            status: 'error',
            message: 'Forbidden',
        });
    }

    const data = await Transaction.create({
        date,
        product_id: id,
        quantity,
        price: product.price,
        buying_price: product.buying_price,
        type,
        info,
        customer_id,
        merchant_id: req.authUser.merchant_id,
    });

    res.send({
        status: 'success',
        data: data,
    });
};

exports.edit = async (req, res) => {
    const id = req.params.transaction_id;

    const transaction = await Transaction.findOne({
        where: {
            id,
        },
        attributes: { exclude: ['MerchantId'] },
    });

    if (!transaction) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    const schema = Joi.object({
        date: Joi.date().format('YYYY-MM-DD'),
        product_id: Joi.number(),
        type: Joi.string(),
        quantity: Joi.number().integer(),
        info: Joi.string().allow(null),
        customer_id: Joi.number().allow(null),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const date = req.body.date;
    const product_id = req.body.product_id || transaction.product_id;
    const type = req.body.type;
    const quantity = req.body.quantity;
    const info = req.body.info;
    const customer_id = req.body.customer_id;

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

    if (!modifyAccess(req.authUser, product)) {
        return res.status(401).send({
            status: 'error',
            message: 'Forbidden',
        });
    }

    if (date) {
        transaction.date = date;
    }
    transaction.product_id = product_id;
    if (quantity) {
        transaction.quantity = quantity;
    }
    if (type) {
        transaction.type = type;
    }
    transaction.info = info;
    if (type === 'sell' && !customer_id) {
        return res.status(400).send({
            status: 'error',
            message: 'customer_id is required if the type is sell',
        });
    } else if (type === 'buy' && customer_id) {
        return res.status(400).send({
            status: 'error',
            message: 'customer_id is not required if the type is buy',
        });
    }
    if (customer_id) {
        const customer = await Customer.findByPk(customer_id);

        if (!customer) {
            return res.status(400).send({
                status: 'error',
                message: 'Customer not found',
            });
        }

        if (!canEdit(req.authUser, customer)) {
            return res.status(403).send('Forbidden');
        }
    }

    transaction.customer_id = customer_id;

    transaction.save();

    res.send({
        status: 'success',
        data: transaction,
    });
};

exports.delete = async (req, res) => {
    const id = req.params.transaction_id;

    const transaction = await Transaction.findOne({
        where: {
            id,
        },
        attributes: { exclude: ['MerchantId'] },
    });

    if (!transaction) {
        return res.status(400).send({
            status: 'error',
            message: 'Transaction not found',
        });
    }

    if (!modifyAccess(req.authUser, transaction)) {
        return res.status(403).send('Forbidden');
    }

    transaction.destroy();

    res.send({
        status: 'success',
        transaction,
    });
};

exports.revenue = async (req, res) => {
    const schema = Joi.object({
        start_date: Joi.date().format('YYYY-MM-DD').required(),
        end_date: Joi.date().format('YYYY-MM-DD').required(),
    });

    const { error } = schema.validate(req.query);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const startDate = new Date(req.query.start_date);
    const endDate = new Date(req.query.end_date);

    const transactions = await Transaction.findAll({
        where: {
            date: {
                [Op.and]: [{[Op.gte]: startDate}, {[Op.lte]: endDate}]
            },
            merchant_id: req.authUser.merchant_id,
        },
        attributes: { exclude: ['MerchantId'] },
        include: ['product'],
        order: [
            ['updated_at', 'desc']
        ]
    });

    let In = [];
    let Out = [];

    transactions.map(({ price, buying_price, quantity, type }) => {
        if (type === 'buy') {
            Out.push(buying_price * quantity);
        } else {
            In.push(price * quantity);
        }
    });

    const income = In.reduce((a, b) => a + b, 0);
    const spending = Out.reduce((a, b) => a + b, 0);

    res.send({
        status: 'success',
        data: {
            income,
            spending,
            revenue: income - spending,
            transactions,
        }
    });
};
