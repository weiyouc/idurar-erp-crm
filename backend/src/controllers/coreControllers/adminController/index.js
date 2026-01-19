const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const list = require('./list');
const update = require('./update');

const baseController = createUserController('Admin');

module.exports = {
  ...baseController,
  list,
  update
};
