const { Customer, Op } = require('../models');
const Joi = require('@hapi/joi');

const { canEdit } = require('../permissions/customer');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number().integer(),
        limit: Joi.number().integer(),
        name: Joi.string(),
        id: Joi.number(),
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
    const name = req.query.name || '';
    const id = req.query.id * 1;

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
        limit = await Customer.count({
            where: {
                merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
            },
        });
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
        where: {
            merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
            name: {
                [Op.iLike]: `%${name}%`,
            },
            id: id ? id : { [Op.not]: null },
        },
        order: sortBy,
        limit: limit,
        offset: offset,
    });

    res.send({
        status: 'success',
        totalPage: Math.ceil(count / limit),
        totalData: count,
        page,
        data: rows,
    });
};

exports.add = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required().min(2),
        email: Joi.string().email().allow(null),
        phone: Joi.string().required(),
        address: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const merchant_id = req.authUser.merchant_id;

    const isNameUsed = await Customer.findOne({
        where: {
            name: name,
            merchant_id: merchant_id || { [Op.not]: null }
        },
    });

    if (isNameUsed) {
        return res.status(400).send({
            status: 'error',
            message: 'Name already exist',
        });
    }

    if (email) {
        const isEmailUsed = await Customer.findOne({
            where: {
                email,
            },
        });

        if (isEmailUsed) {
            return res.status(400).send({
                status: 'error',
                message: 'Email already exist',
            });
        }
    }

    const customer = await Customer.create({
        name,
        email,
        phone,
        address,
        merchant_id,
    });

    res.send({
        status: 'success',
        data: customer,
    });
};

exports.edit = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2),
        email: Joi.string().email().allow(null),
        phone: Joi.string(),
        address: Joi.string(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;

    const id = req.params.customer_id;

    const customer = await Customer.findOne({
        where: {
            id,
        },
    });

    if (!customer) {
        return res.status(400).send({
            status: 'error',
            message: 'Customer not found',
        });
    }

    if (!canEdit(req.authUser, customer)) {
        return res.status(403).send('Forbidden');
    }

    if (name) {
        if (customer.name != name) {
            const isNameUsed = await Customer.findOne({
                where: {
                    name: {
                        [Op.iLike]: `%${name}%`,
                    },
                },
            });

            if (isNameUsed) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Name already exist',
                });
            }
        }
        customer.name = name;
    }
    if (email) {
        customer.email = email;
    }
    if (phone) {
        customer.phone = phone;
    }
    if (address) {
        customer.address = address;
    }
    customer.save();

    res.send({
        status: 'success',
        data: customer,
    });
};

exports.delete = async (req, res) => {
    const id = req.params.customer_id;

    const customer = await Customer.findByPk(id);

    if (!customer) {
        return res.status(400).send({
            status: 'error',
            message: 'Customer not found',
        });
    }

    if (!canEdit(req.authUser, customer)) {
        return res.status(403).send('Forbidden');
    }

    customer.destroy();

    res.send({
        status: 'success',
    });
};
