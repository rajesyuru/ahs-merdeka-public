const {Op, User} = require('../models');

exports.users = async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const count = await User.count({
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
    });
    const users = await User.findAll({
        attributes: [
            'name',
            'email',
            'group_id',
            'merchant_id',
            'created_at',
            'updated_at'
        ],
        where: {
            name: {
                [Op.iLike]: `%${search}%`,
            },
        },
        include: ['group', 'merchant'],
        order: [
            ['created_at', 'asc']
        ],
        limit: limit,
        offset: offset,
    });

    res.send({
        status: 'success',
        totalData: count,
        totalPage: Math.ceil(count / limit),
        page: page,
        data: users
    });
}
