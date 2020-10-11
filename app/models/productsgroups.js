'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProductsGroups = sequelize.define('ProductsGroups', {
    name: DataTypes.STRING,
    quantity: DataTypes.DOUBLE,
    merchant_id: DataTypes.INTEGER
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  ProductsGroups.associate = function(models) {
    models.ProductsGroups.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'owner',
    });
    models.ProductsGroups.hasMany(models.Product, {
      foreignKey: 'group_id',
      as: 'products',
    });
  };
  return ProductsGroups;
};