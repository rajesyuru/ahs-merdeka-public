exports.canView = (user) => {
    return user.merchant_id === null || user.group_id === 1;
};

exports.canEditAll = (user) => {
    return user.merchant_id === null;
};

exports.canEditMember = (user) => {
    return user.group_id === 1;
};