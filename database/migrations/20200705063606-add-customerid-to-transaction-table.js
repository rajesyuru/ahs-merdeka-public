'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Transactions', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      onDelete: 'CASCADE',
      references: {
        model: 'Customers',
        key: 'id',
        as: 'customer_id'
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Transactions', 'customer_id');
  }
};
