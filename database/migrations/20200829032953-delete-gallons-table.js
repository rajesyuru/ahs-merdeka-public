'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Stocks', 'gallon_id');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Stocks', 'gallon_id');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
