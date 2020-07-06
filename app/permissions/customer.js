exports.canView = (user) => {
    return user.group_id === 1;
};

exports.canAdd = (user) => {
    return user.merchant_id !== null && user.group_id === 1;
};

exports.canEdit = (user, customer) => {
    return (user.merchant_id !== null && user.group_id === 1) && user.merchant_id === customer.merchant_id
}