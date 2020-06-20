'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Transactions', 'type', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      });
      await queryInterface.addColumn('Transactions', 'info', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Transactions', 'type');
      await queryInterface.removeColumn('Transactions', 'info');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
