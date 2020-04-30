const {Group} = require('../models');

exports.groups = async (req, res) => {
    const groups = await Group.findAll();

    res.send(groups);
};
