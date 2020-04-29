'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('People', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
   return queryInterface.bulkInsert('Groups', [
    {
      name: 'Admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Akunting',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Pengantar barang',
      created_at: new Date(),
      updated_at: new Date()
    },
  ], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
    return queryInterface.bulkDelete('Groups', null, {});
  }
};
