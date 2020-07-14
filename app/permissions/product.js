exports.canView = (user) => {
    return true;
};

exports.canEdit = (user, product) => {
    return (user.merchant_id !== null && user.group_id === 1) && user.merchant_id === product.merchant_id;
};

exports.canAdd = (user) => {
    return user.merchant_id !== null && user.group_id === 1;
};

exports.canFetchStocks = (user) => {
    return user.merchant_id !== null && user.group_id === 1;
};
