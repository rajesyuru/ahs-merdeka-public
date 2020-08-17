exports.haveAccess = (user) => user.group_id === 1;

exports.addAccess = (user) => user.merchant_id !== null;

exports.modifyAccess = (user, item) => user.merchant_id === item.merchant_id;