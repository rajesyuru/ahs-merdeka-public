const { Product, Op, ProductsGroups } = require('../models');
const Joi = require('@hapi/joi');
const { modifyAccess } = require('../permissions/product_group');

exports.fetch = async (req, res) => {
    const schema = Joi.object({
        page: Joi.number().integer(),
        limit: Joi.number().integer(),
        id: Joi.number(),
        name: Joi.string(),
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

    let limit = req.query.limit * 1;

    if (!limit) {
        limit = await ProductsGroups.count({
            where: {
                merchant_id: merchant_id || { [Op.not]: null },
            },
        });
    }

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

    const page = req.query.page * 1 || 1;
    const offset = (page - 1) * limit;
    const idSearch = req.query.id * 1 || null;
    const nameSearch = req.query.name || '';

    const { count, rows } = await ProductsGroups.findAndCountAll({
        where: {
            id: idSearch || { [Op.not]: null },
            name: {
                [Op.iLike]: `%${nameSearch}%`,
            },
            merchant_id: merchant_id || { [Op.not]: null },
        },
        order: sortBy,
        include: ['owner', 'product_group'],
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
        name: Joi.string().min(2).required(),
        quantity: Joi.number().integer().required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const quantity = req.body.quantity * 1;
    const merchant_id = req.authUser.merchant_id;

    const productsGroup = await ProductsGroups.create({
        name,
        quantity,
        merchant_id,
    });

    res.send({
        status: 'success',
        data: productsGroup,
    });
};

exports.edit = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2),
        quantity: Joi.number().integer(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const quantity = req.body.quantity;
    const group_id = req.params.group_id;

    const productsGroup = await ProductsGroups.findOne({
        where: {
            id: group_id,
        },
    });

    if (!productsGroup) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, productsGroup)) {
        return res.status(403).send('Forbidden');
    }

    if (name) {
        productsGroup.name = name;
    }
    if (quantity !== null && quantity !== undefined) {
        productsGroup.quantity = quantity;
    }

    productsGroup.save();

    res.send({
        status: 'success',
        data: productsGroup,
    });
};

exports.delete = async (req, res) => {
    const group_id = req.params.group_id;

    const productsGroup = await ProductsGroups.findOne({
        where: {
            id: group_id
        }
    });

    if (!productsGroup) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found'
        });
    }

    if (!modifyAccess(req.authUser, productsGroup)) {
        return res.status(403).send('Forbidden')
    }

    productsGroup.destroy();

    res.send({
        status: 'success',
        data: productsGroup
    })
};
