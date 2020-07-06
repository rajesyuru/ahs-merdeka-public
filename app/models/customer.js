'use strict';
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Customer.associate = function(models) {
    models.Customer.hasMany(models.Transaction, {
      foreignKey: 'customer_id',
    });

    models.Customer.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'merchant'
    })
  };
  return Customer;
};