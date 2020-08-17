'use strict';
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    date: DataTypes.DATE,
    product_id: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
    buying_price: DataTypes.DOUBLE,
    type: DataTypes.STRING,
    info: DataTypes.STRING,
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    MerchantId: 'merchant_id'
  });
  Transaction.associate = function(models) {
    models.Transaction.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });

    models.Transaction.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer',
    });

    models.Transaction.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'merchant',
    });
  };
  return Transaction;
};