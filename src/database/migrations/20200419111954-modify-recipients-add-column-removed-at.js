module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('recipients', 'removed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    }),

  down: queryInterface =>
    queryInterface.removeColumn('recipients', 'removed_at'),
};
