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
    updatedAt: 'updated_at'
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
  };
  return Transaction;
};