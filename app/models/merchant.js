'use strict';
module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define('merchant', {
    name: DataTypes.STRING
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Merchant.associate = function(models) {
    // associations can be defined here
  };
  return Merchant;
};