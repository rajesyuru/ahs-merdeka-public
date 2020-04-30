'use strict';
module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    name: DataTypes.STRING
  }, {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  Group.associate = function(models) {
    // associations can be defined here
  };
  return Group;
};