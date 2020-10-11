'use strict';
module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define('Merchant', {
    name: DataTypes.STRING
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Merchant.associate = function(models) {
  };
  return Merchant;
};