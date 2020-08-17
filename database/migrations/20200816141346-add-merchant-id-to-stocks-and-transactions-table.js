'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Transactions', 'merchant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        onDelete: 'CASCADE',
        references: {
          model: 'Merchants',
          key: 'id',
          as: 'merchant_id'
        }
      });
      await queryInterface.addColumn('Stocks', 'merchant_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        onDelete: 'CASCADE',
        references: {
          model: 'Merchants',
          key: 'id',
          as: 'merchant_id'
        }
      });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Transactions', 'merchant_id');
      await queryInterface.removeColumn('Stocks', 'merchant_id');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
