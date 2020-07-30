const { Transaction, Op, Product, Customer } = require('../models');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { canAddEdit, canDelete } = require('../permissions/transaction');
const { canEdit } = require('../permissions/customer');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        id: Joi.number(),
        date: Joi.date().format('YYYY-MM-DD'),
        product_id: Joi.number(),
        type: Joi.string(),
        info: Joi.string(),
    });

    const { error } = schema.validate(req.query);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const page = req.query.page * 1 || 1; 
    const limit = req.query.limit * 1 || 2147483647;
    const offset = (page - 1) * limit;
    const idSearch = req.query.id * 1 || null;
    const dateSearch = req.query.date;
    const productSearch = req.query.product_id * 1 || null;
    const typeSearch = req.query.search;
    const infoSearch = req.query.info || '';

    const merchant_id = req.authUser.merchant_id;

    let products;
    let ownedProductsId = [];

    const sort = [['date', 'desc']];

    if (merchant_id !== null) {
        products = await Product.findAll({
            where: {
                merchant_id,
            },
        });

        ownedProductsId = products.map((product) => product.id);
    }

    const { count, rows } = await Transaction.findAndCountAll({
        where: {
            id: idSearch
                ? {
                      [Op.eq]: idSearch,
                  }
                : {
                      [Op.not]: null,
                  },
            date: dateSearch
                ? {
                      [Op.iLike]: `%${dateSearch}%`,
                  }
                : {
                      [Op.not]: null,
                  },
            product_id: productSearch
                ? {
                      [Op.eq]: productSearch,
                  }
                : merchant_id
                ? {
                      [Op.in]: ownedProductsId,
                  }
                : {
                      [Op.gt]: 0,
                  },
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
                          [Op.iLike]: `%${infoSearch}%`,
                          [Op.is]: null,
                      },
                  },
        },
        include: ['product', 'customer'],
        order: sort,
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

    if (!canAddEdit(req.authUser, product)) {
        return res.status(401).send({
            status: 'error',
            message: 'Forbidden',
        });
    }

    // console.log(product.price)

    const data = await Transaction.create({
        date,
        product_id: id,
        quantity,
        price: product.price,
        buying_price: product.buying_price,
        type,
        info,
        customer_id,
    });

    res.send({
        status: 'success',
        data: data,
    });
};

exports.edit = async (req, res) => {
    const id = req.params.transaction_id;

    const transaction = await Transaction.findByPk(id)

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
        customer_id: Joi.number().allow(null)
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

    if (!canAddEdit(req.authUser, product)) {
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
            id
        },
        include: ['product'],
    })

    if (!transaction) {
        return res.status(400).send({
            status: 'error',
            message: 'Transaction not found'
        })
    }

    if (!canDelete(req.authUser, transaction)) {
        return res.status(403).send('Forbidden')
    }

    transaction.destroy();
    
    res.send({
        status: 'success',
        transaction
    });
};
