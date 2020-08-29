'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Gallons');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Gallons');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
