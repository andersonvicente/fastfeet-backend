module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('deliveries', 'removed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    }),

  down: queryInterface =>
    queryInterface.removeColumn('deliveries', 'removed_at'),
};
