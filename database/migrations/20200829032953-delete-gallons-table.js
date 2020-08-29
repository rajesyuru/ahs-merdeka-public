'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Gallons');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },

  down: (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('Gallons');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
};
