'use strict';
module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define('Stock', {
    date: DataTypes.DATE,
    quantity: DataTypes.DOUBLE,
    type: DataTypes.STRING,
    info: DataTypes.STRING
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Stock.associate = function(models) {
    models.Stock.belongsTo(models.Gallon, {
      foreignKey: 'gallon_id',
      as: 'gallon',
    });

    models.Stock.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer',
    });

    models.Stock.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'merchant',
    });
  };
  return Stock;
};