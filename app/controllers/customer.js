const { Customer, Op, Merchant } = require('../models');
const Joi = require('@hapi/joi');

const { canEdit } = require('../permissions/customer');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        name: Joi.string(),
        id: Joi.number()
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
    const name = req.query.name || '';
    const id = req.query.id;
    const offset = (page - 1) * limit;

    const merchant_id = req.authUser.merchant_id;

    const { count, rows } = await Customer.findAndCountAll({
        where: {
            merchant_id: merchant_id ? merchant_id : { [Op.not]: null },
            name: {
                [Op.iLike]: `%${name}%`
            },
            id: id ? id : { [Op.not]: null }
        },
        order: [['updated_at', 'desc']],
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
            name
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
        status: 'success'
    })
}