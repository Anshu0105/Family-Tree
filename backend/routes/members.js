const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { assertValidObjectId } = require('../utils/objectId');
const {
  addMemberWithRelations,
  removeMemberFromGraph,
  getTreeMembers,
} = require('../services/memberRelations');

const MEMBER_UPDATE_FIELDS = ['name', 'nickname', 'gender', 'position'];
const DETAIL_FIELDS = [
  'phone', 'email', 'address', 'dob', 'marriageDate',
  'qualification', 'profession', 'dateOfDeath', 'bloodGroup',
];

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function pickMemberUpdateFields(body) {
  const update = {};
  for (const field of MEMBER_UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }
  if (body.details && typeof body.details === 'object') {
    for (const key of DETAIL_FIELDS) {
      if (body.details[key] !== undefined) {
        update[`details.${key}`] = body.details[key];
      }
    }
  }
  return update;
}

// GET all members (used initially or for search)
router.get('/', asyncHandler(async (req, res) => {
  const members = await Member.find().lean();
  res.json(members);
}));

// GET /api/members/tree/:id - focused family view (must be before /:id)
router.get('/tree/:id', asyncHandler(async (req, res) => {
  const depth = req.query.depth ?? 2;
  const family = await getTreeMembers(req.params.id, depth);
  res.json(family);
}));

// POST new member (Add Root, Child, or Spouse)
router.post('/', asyncHandler(async (req, res) => {
  const savedMember = await addMemberWithRelations(req.body);
  res.status(201).json(savedMember);
}));

// PUT save node positions (must be before /:id)
router.put('/positions/save', asyncHandler(async (req, res) => {
  const { nodes } = req.body;
  if (!Array.isArray(nodes)) {
    const err = new Error('nodes array is required');
    err.statusCode = 400;
    throw err;
  }
  for (const node of nodes) {
    if (node.type === 'member' && node.id) {
      assertValidObjectId(node.id, 'node id');
      await Member.findByIdAndUpdate(node.id, { position: node.position });
    }
  }
  res.json({ success: true });
}));

// PUT update member details (profile fields only — not graph relationships)
router.put('/:id', asyncHandler(async (req, res) => {
  assertValidObjectId(req.params.id, 'member id');
  const update = pickMemberUpdateFields(req.body);
  if (Object.keys(update).length === 0) {
    const err = new Error('No valid fields to update');
    err.statusCode = 400;
    throw err;
  }
  const updatedMember = await Member.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!updatedMember) {
    const err = new Error('Member not found');
    err.statusCode = 404;
    throw err;
  }
  res.json(updatedMember);
}));

// DELETE member
router.delete('/:id', asyncHandler(async (req, res) => {
  await removeMemberFromGraph(req.params.id);
  res.json({ message: 'Deleted' });
}));

module.exports = router;
