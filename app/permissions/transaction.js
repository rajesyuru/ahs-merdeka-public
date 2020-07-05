exports.canView = (user) => {
    return user.merchant_id === null || user.group_id === 1;
};

exports.canAddEdit = (user, product) => {
    return (user.merchant_id !== null && user.group_id === 1) && user.merchant_id === product.merchant_id
};

exports.canDelete = (user) => {
    return user.merchant_id !== null && user.group_id === 1;
};

exports.canFetchStocks = (user) => {
    return user.merchant_id !== null && user.group_id === 1;
}
