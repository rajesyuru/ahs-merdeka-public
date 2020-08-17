'use strict';
module.exports = (sequelize, DataTypes) => {
  const Gallon = sequelize.define('Gallon', {
    name: DataTypes.STRING,
    stock: DataTypes.DOUBLE
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Gallon.associate = function(models) {
    models.Gallon.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'owner',
    });
  };
  return Gallon;
};