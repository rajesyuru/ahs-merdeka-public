const {Group, Op} = require('../models');

exports.groups = async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
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
        page: page * 1,
        data: groups,
    });
};
