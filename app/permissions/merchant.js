exports.canAccess = (user) => {
    return user.merchant_id === null;
}