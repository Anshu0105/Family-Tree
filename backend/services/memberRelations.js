const Member = require('../models/Member');
const { assertValidObjectId } = require('../utils/objectId');
const { collectTreeMemberIds } = require('./treeCollection');

function uniqueObjectIds(ids) {
  const seen = new Set();
  const result = [];
  for (const id of ids) {
    const key = String(id);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(id);
    }
  }
  return result;
}

function httpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function requireMember(id, label) {
  assertValidObjectId(id, label);
  const doc = await Member.findById(id);
  if (!doc) {
    throw httpError(`${label} not found`, 404);
  }
  return doc;
}

function validateRelationIds(body) {
  if (body.childId) assertValidObjectId(body.childId, 'childId');
  if (body.parentId) assertValidObjectId(body.parentId, 'parentId');
  if (body.spouseId) assertValidObjectId(body.spouseId, 'spouseId');
}

function assertDistinctRelationTargets(body) {
  const targets = [body.childId, body.parentId, body.spouseId].filter(Boolean).map(String);
  if (new Set(targets).size !== targets.length) {
    throw httpError('Relation targets must be distinct members', 400);
  }
}

function assertNotSelf(memberId, targetId, label) {
  if (memberId && targetId && String(memberId) === String(targetId)) {
    throw httpError(`Cannot set ${label} to the same member`, 400);
  }
}

function hasId(arr, id) {
  return (arr || []).some((entry) => String(entry) === String(id));
}

async function assertNoDuplicateRelations(body) {
  if (body.childId && body.parentId) {
    const child = await Member.findById(body.childId).lean();
    const parent = await Member.findById(body.parentId).lean();
    if (child && parent) {
      if (hasId(child.parents, body.parentId)) {
        throw httpError('Parent relationship already exists', 409);
      }
      if (hasId(parent.children, body.childId)) {
        throw httpError('Child relationship already exists', 409);
      }
    }
  }

  if (body.childId && body.spouseId) {
    const child = await Member.findById(body.childId).lean();
    if (child && hasId(child.parents, body.spouseId)) {
      throw httpError('Parent relationship already exists', 409);
    }
  }

  if (body.parentId && body.spouseId) {
    const parent = await Member.findById(body.parentId).lean();
    if (parent && hasId(parent.children, body.spouseId)) {
      throw httpError('Child relationship already exists', 409);
    }
  }

  if (body.spouseId) {
    const spouse = await Member.findById(body.spouseId).lean();
    if (body.childId && spouse && hasId(spouse.children, body.childId)) {
      throw httpError('Child relationship already exists', 409);
    }
    if (body.parentId && spouse && hasId(spouse.spouses, body.parentId)) {
      throw httpError('Spouse relationship already exists', 409);
    }
  }
}

async function linkAsParentOfChild(savedMember, childId) {
  const child = await Member.findById(childId);
  if (hasId(child.parents, savedMember._id)) {
    throw httpError('Parent relationship already exists', 409);
  }

  await Member.findByIdAndUpdate(childId, { $addToSet: { parents: savedMember._id } });
  savedMember.children = [childId];

  if (child.parents.length === 2) {
    const otherParentId = child.parents.find(
      (p) => String(p) !== String(savedMember._id)
    );
    if (otherParentId) {
      await Member.findByIdAndUpdate(otherParentId, {
        $addToSet: { spouses: savedMember._id },
      });
      savedMember.spouses = [otherParentId];
    }
  }
  await savedMember.save();
}

async function linkAsChildOfParent(savedMember, parentId) {
  const parentDoc = await Member.findById(parentId);
  if (hasId(parentDoc.children, savedMember._id)) {
    throw httpError('Child relationship already exists', 409);
  }

  await Member.findByIdAndUpdate(parentId, { $addToSet: { children: savedMember._id } });

  const parentIds = [parentDoc._id];
  for (const spouseId of parentDoc.spouses || []) {
    parentIds.push(spouseId);
    await Member.findByIdAndUpdate(spouseId, { $addToSet: { children: savedMember._id } });
  }
  savedMember.parents = uniqueObjectIds(parentIds);
  await savedMember.save();
}

async function linkAsSpouseOf(savedMember, spouseId) {
  const existingSpouse = await Member.findById(spouseId);
  if (hasId(existingSpouse.spouses, savedMember._id)) {
    throw httpError('Spouse relationship already exists', 409);
  }

  await Member.findByIdAndUpdate(spouseId, { $addToSet: { spouses: savedMember._id } });
  savedMember.spouses = [spouseId];

  if (existingSpouse.children?.length) {
    savedMember.children = existingSpouse.children;
    for (const childId of existingSpouse.children) {
      const child = await Member.findById(childId);
      if (!hasId(child.parents, savedMember._id)) {
        await Member.findByIdAndUpdate(childId, { $addToSet: { parents: savedMember._id } });
      }
    }
  }
  await savedMember.save();
}

async function addMemberWithRelations(body) {
  validateRelationIds(body);
  assertDistinctRelationTargets(body);
  await assertNoDuplicateRelations(body);

  if (body.childId) await requireMember(body.childId, 'Child');
  if (body.parentId) await requireMember(body.parentId, 'Parent');
  if (body.spouseId) await requireMember(body.spouseId, 'Spouse');

  const newMember = new Member({
    name: body.name || 'New Member',
    nickname: body.nickname || '',
    gender: body.gender || '',
    details: body.details || {},
    position: body.position || { x: 0, y: 0 },
  });

  let savedMember = await newMember.save();

  assertNotSelf(savedMember._id, body.childId, 'child');
  assertNotSelf(savedMember._id, body.parentId, 'parent');
  assertNotSelf(savedMember._id, body.spouseId, 'spouse');

  try {
    if (body.childId) {
      await linkAsParentOfChild(savedMember, body.childId);
      savedMember = await Member.findById(savedMember._id);
    }

    if (body.parentId) {
      await linkAsChildOfParent(savedMember, body.parentId);
      savedMember = await Member.findById(savedMember._id);
    }

    if (body.spouseId) {
      await linkAsSpouseOf(savedMember, body.spouseId);
      savedMember = await Member.findById(savedMember._id);
    }

    return savedMember;
  } catch (err) {
    await Member.findByIdAndDelete(savedMember._id).catch(() => {});
    throw err;
  }
}

async function removeMemberFromGraph(id) {
  assertValidObjectId(id, 'member id');
  await Member.updateMany(
    { $or: [{ children: id }, { parents: id }, { spouses: id }] },
    { $pull: { children: id, parents: id, spouses: id } }
  );
  const deleted = await Member.findByIdAndDelete(id);
  if (!deleted) {
    throw httpError('Member not found', 404);
  }
  return deleted;
}

async function getTreeMembers(focusId, depth = 2) {
  assertValidObjectId(focusId, 'member id');
  const activeMember = await Member.findById(focusId).lean();
  if (!activeMember) {
    throw httpError('Member not found', 404);
  }

  const parsedDepth = Math.max(0, Math.min(10, parseInt(depth, 10) || 2));
  const dedupedIds = await collectTreeMemberIds(activeMember, parsedDepth);
  return Member.find({ _id: { $in: dedupedIds } }).lean();
}

module.exports = {
  addMemberWithRelations,
  removeMemberFromGraph,
  getTreeMembers,
  uniqueObjectIds,
};
