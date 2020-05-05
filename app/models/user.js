'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    group_id: DataTypes.INTEGER,
    merchant_id: DataTypes.INTEGER
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  User.associate = function(models) {
    models.User.belongsTo(models.Group, {
      as: 'group',
      foreignKey: 'group_id',
    });

    models.User.belongsTo(models.Merchant, {
      as: 'merchant',
      foreignKey: 'merchant_id',
    });
  };
  return User;
};