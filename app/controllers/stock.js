const { Stock, Gallon, Op, Customer } = require('../models');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { modifyAccess } = require('../permissions/stock');

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
    const idSearch = req.query.id * 1;
    const dateSearch = req.query.date;
    const gallonSearch = req.query.gallon_id * 1 || null;
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
        limit = await Stock.count({
            where: {
                merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
            },
        });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Stock.findAndCountAll({
        where: {
            id: idSearch ? idSearch : { [Op.not]: null },
            date: dateSearch ? new Date(dateSearch) : { [Op.not]: null },
            gallon_id: gallonSearch ? gallonSearch : { [Op.gt]: 0 },
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
            merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
        },
        include: ['gallon', 'customer'],
        order: sortBy,
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

const typeCondition = (type) => {
    if (type === 'sell' || type === 'borrow' || type === 'return') {
        return 1;
    } else if (type === 'buy') {
        return 2;
    } else {
        return 0;
    }
};

exports.add = async (req, res) => {
    const schema = Joi.object({
        date: Joi.date().format('YYYY-MM-DD').required(),
        gallon_id: Joi.number().required(),
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
    const id = req.body.gallon_id;
    const type = req.body.type;
    const quantity = req.body.quantity;
    const info = req.body.info;
    const customer_id = req.body.customer_id;

    const valType = typeCondition(type);

    if (valType === 1) {
        if (!customer_id) {
            return res.status(400).send({
                status: 'error',
                message:
                    'customer_id is required if the type is sell, borrow, or return',
            });
        }
    } else if (valType === 2) {
        if (customer_id) {
            return res.status(400).send({
                status: 'error',
                message: 'customer_id is not required if the type is buy',
            });
        }
    } else {
        return res.status(400).send({
            status: 'error',
            message: 'Type is unknown',
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

        if (!modifyAccess(req.authUser, customer)) {
            return res.status(403).send('Forbidden');
        }
    }

    const gallon = await Gallon.findByPk(id);

    if (!gallon) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, gallon)) {
        return res.status(403).send('Forbidden');
    }

    const data = await Stock.create({
        date,
        gallon_id: id,
        quantity,
        type,
        info,
        customer_id,
        merchant_id: req.authUser.merchant_id
    });

    if (type === 'sell' || type === 'borrow') {
        gallon.stock -= quantity;
    } else {
        gallon.stock += quantity;
    }
    gallon.save();

    res.send({
        status: 'success',
        data,
        gallon,
    });
};

exports.edit = async (req, res) => {
    const id = req.params.stocks_id;

    const stock = await Stock.findOne({
        where: {
            id,
        },
        include: ['gallon'],
    });

    if (!stock) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, stock.gallon)) {
        return res.status(403).send('Forbidden');
    }

    const schema = Joi.object({
        date: Joi.date().format('YYYY-MM-DD'),
        gallon_id: Joi.number(),
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
    const gallon_id = req.body.gallon_id;
    const type = req.body.type;
    const quantity = req.body.quantity;
    const info = req.body.info;
    const customer_id = req.body.customer_id;

    if (date) {
        stock.date = date;
    }

    let gallon;

    if (gallon_id) {
        gallon = await Gallon.findByPk(gallon_id);

        if (!gallon) {
            return res.status(400).send({
                status: 'error',
                message: 'Item not found',
            });
        }

        if (!modifyAccess(req.authUser, gallon)) {
            return res.status(403).send('Forbidden');
        }

        stock.gallon_id = gallon_id;
    } else {
        gallon = await Gallon.findOne({
            where: {
                id: stock.gallon.id,
            },
        });
    }

    if (info !== undefined) {
        stock.info = info;
    }

    const stockType = typeCondition(stock.type);
    let valType = typeCondition(stock.type);

    if (type) {
        valType = typeCondition(type);
        if (valType === 2) {
            stock.customer_id = null;
        } else if (!valType) {
            return res.status(400).send({
                status: 'error',
                message: 'Type is unknown',
            });
        }
        stock.type = type;
    }
    if (!isNaN(quantity)) {
        if (stockType === 1) {
            gallon.stock += stock.quantity;
        } else {
            gallon.stock -= stock.quantity;
        }

        if (valType === 1) {
            gallon.stock -= quantity;
        } else {
            gallon.stock += quantity;
        }
        stock.quantity = quantity;
    }
    if (!customer_id) {
        if (valType === 1) {
            return res.status(400).send({
                status: 'error',
                message:
                    'customer_id is required if the type is sell, borrow, or return',
            });
        }
    } else {
        if (valType === 2) {
            return res.status(400).send({
                status: 'error',
                message: 'customer_id is not allowed if the type is buy',
            });
        }

        const customer = await Customer.findByPk(customer_id);

        if (!customer) {
            return res.status(400).send({
                status: 'error',
                message: 'Customer not found',
            });
        }

        if (!modifyAccess(req.authUser, customer)) {
            return res.status(403).send('Forbidden');
        }

        stock.customer_id = customer_id;
    }

    stock.save();
    gallon.save();

    res.send({
        status: 'success',
        data: {
            stock: {
                id: stock.id,
                date: stock.date,
                gallon_id: stock.gallon_id,
                quantity: stock.quantity,
                type: stock.type,
                info: stock.info,
                customer_id: stock.customer_id,
                merchant_id: stock.merchant_id
            },
            gallon,
        },
    });
};

exports.delete = async (req, res) => {
    const id = req.params.stocks_id * 1;

    const stock = await Stock.findByPk(id);

    if (!stock) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, stock)) {
        return res.status(403).send('Forbidden');
    }

    const valType = typeCondition(stock.type);
    const gallon = await Gallon.findOne({
        where: {
            id: stock.gallon_id,
        },
    });

    if (valType === 1) {
        gallon.stock += stock.quantity;
    } else {
        gallon.stock -= stock.quantity;
    }
    gallon.save();
    stock.destroy();

    res.send({
        status: 'success',
        data: {
            stock: {
                id: stock.id,
                date: stock.date,
                gallon_id: stock.gallon_id,
                quantity: stock.quantity,
                type: stock.type,
                info: stock.info,
                customer_id: stock.customer_id,
            },
            gallon,
        },
    });
};
