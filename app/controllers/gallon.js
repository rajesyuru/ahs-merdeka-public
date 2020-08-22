const { Gallon, Op } = require('../models');
const Joi = require('@hapi/joi');
const { modifyAccess } = require('../permissions/gallon');

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

    let limit = 20;

    if (!req.query.limit) {
        const dataCount = await Gallon.count({
            where: {
                merchant_id,
            },
        });

        if (dataCount) {
            limit = dataCount;
        }
    } else {
        limit = req.query.limit * 1;
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

    const { count, rows } = await Gallon.findAndCountAll({
        where: {
            id:
                idSearch && merchant_id !== null
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
        order: sortBy,
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
        name: Joi.string().min(2).required(),
        stock: Joi.number().integer().allow(null).required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const name = req.body.name;
    const stock = req.body.stock || 0;

    const merchant_id = req.authUser.merchant_id * 1;

    const findName = await Gallon.findOne({
        where: {
            name: {
                [Op.iLike]: `%${name}%`,
            },
            merchant_id,
        },
    });

    if (findName) {
        return res.status(400).send({
            status: 'error',
            message: 'Item already exists',
        });
    }

    const create = await Gallon.create({
        name,
        stock,
        merchant_id,
    });

    res.send({
        status: 'success',
        data: create,
    });
};

exports.edit = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2),
        stock: Joi.number().integer().min(0),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).send({
            status: 'error',
            message: error.message,
        });
    }

    const gallon_id = req.params.gallon_id;

    const gallon = await Gallon.findOne({
        where: {
            id: gallon_id,
        },
    });

    if (!gallon) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, gallon)) {
        return res.status(403).send('Forbidden');
    }

    const name = req.body.name;
    const stock = req.body.stock;

    if (name) {
        gallon.name = name;
    }
    if (!isNaN(stock)) {
        gallon.stock = stock;
    }

    gallon.save();

    res.send({
        status: 'success',
        data: gallon,
    });
};

exports.delete = async (req, res) => {
    const gallon_id = req.params.gallon_id;

    const gallon = await Gallon.findOne({
        where: {
            id: gallon_id,
        },
    });

    if (!gallon) {
        return res.status(400).send({
            status: 'error',
            message: 'Item not found',
        });
    }

    if (!modifyAccess(req.authUser, gallon)) {
        return res.status(403).send('Forbidden');
    }

    gallon.destroy();

    res.send({
        status: 'success',
        data: gallon,
    });
};
