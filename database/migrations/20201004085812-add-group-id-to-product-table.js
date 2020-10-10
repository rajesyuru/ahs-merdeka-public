'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Products', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      onDelete: 'SET NULL',
      references: {
        model: 'ProductsGroups',
        key: 'id',
        as: 'group_id'
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Products', 'group_id');
  }
};
