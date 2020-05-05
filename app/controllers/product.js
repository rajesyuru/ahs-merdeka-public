const {Product, Op} = require('../models');
const Joi = require('@hapi/joi');

exports.fetch = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const count = await Product.count({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
    });

    const products = await Product.findAll({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
        include: ['owner'],
        limit: limit,
        offset: offset,
    });

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
        image: Joi.string()
    });

    const {error} = schema.validate(req.body);

    if (error) {
        res.status(400).send({
            status: 'error',
            message: error.message
        })
    };

    const merchant_id = req.authUser.merchant_id;

    // console.log(merchant_id)

    if (!merchant_id) {
        return res.status(400)
            .send({
                status: 'error',
                message: 'Admin tidak dapat menambahkan produk'
            });
    }

    const name = req.body.name;
    const price = req.body.price;
    const image = req.body.image || '';

    const data = await Product.create({
        name,
        price,
        image,
        merchant_id: merchant_id * 1
    })

    res.send({
        status: 'success',
        data: data
    });
}