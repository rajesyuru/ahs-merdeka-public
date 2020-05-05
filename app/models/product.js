'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    name: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    image: DataTypes.STRING
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Product.associate = function(models) {
    // associations can be defined here
    models.Product.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'owner',
    });
  };
  return Product;
};