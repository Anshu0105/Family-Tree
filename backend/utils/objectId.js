const mongoose = require('mongoose');

function isValidObjectId(id) {
  if (id == null || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function assertValidObjectId(id, label) {
  if (!isValidObjectId(id)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
}

module.exports = { isValidObjectId, assertValidObjectId };
