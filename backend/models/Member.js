const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nickname: { type: String, default: '' },
  gender: { type: String, default: '' },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  spouses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  details: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    dob: { type: String, default: '' },
    marriageDate: { type: String, default: '' },
    qualification: { type: String, default: '' },
    profession: { type: String, default: '' },
    dateOfDeath: { type: String, default: '' },
    bloodGroup: { type: String, default: '' }
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Member', memberSchema);
