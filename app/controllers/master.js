const { Group, Op, Transaction, Product, Stock, Gallon } = require('../models');

exports.groups = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const count = await Group.count({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
    });
    const groups = await Group.findAll({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
        limit: limit,
        offset: offset,
    });

    res.send({
        status: 'success',
        totalData: count,
        totalPage: Math.ceil(count / limit),
        page: page,
        data: groups,
    });
};

exports.setMerchantId = async (req, res) => {
    await Transaction.findAll({
        attributes: { exclude: ['MerchantId'] },
    }).then((transactions) => {
        transactions.map(async (transaction) => {
            await Transaction.findOne({
                where: {
                    id: transaction.id,
                },
                include: ['product'],
                attributes: { exclude: ['MerchantId'] },
            }).then((item) => {
                item.merchant_id = item.product.merchant_id;
                item.save();
            });
        });
    }).catch((error) => {
        console.log(error)
    });

    // await Stock.findAll().then((stocks) => {
    //     stocks.map(async (stock) => {
    //         await Stock.findOne({
    //             where: {
    //                 id: stock.id,
    //             },
    //             include: ['gallon'],
    //         }).then((item) => {
    //             item.merchant_id = item.gallon.merchant_id;
    //             item.save();
    //         });
    //     });
    // });

    res.send({
        status: 'success',
    });
};
