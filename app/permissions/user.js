exports.canView = (user) => {
    return user.merchant_id === null || user.group_id === 1;
};

exports.canEdit = (user, editedUser) => {
    if (user.group_id === 1 && user.merchant_id !== null) {
        // admin merchant
        return editedUser.merchant_id === user.merchant_id;
    } else if (user.group_id !== 1) {
        // regular user
        return editedUser.id === user.id;
    } else {
        // super admin
        return true;
    }
};