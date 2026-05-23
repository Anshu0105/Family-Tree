const Member = require('../models/Member');

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

/**
 * Collect member ids around a focus member: focus, parents, spouses, siblings,
 * and descendants up to `depth` generations (default 2 = children + grandchildren).
 */
async function collectTreeMemberIds(focusMember, depth = 2) {
  const focusId = String(focusMember._id);
  const ids = new Set([focusId]);

  for (const parentId of focusMember.parents || []) {
    ids.add(String(parentId));
  }
  for (const spouseId of focusMember.spouses || []) {
    ids.add(String(spouseId));
  }

  if (focusMember.parents?.length) {
    const siblings = await Member.find({
      parents: { $in: focusMember.parents },
      _id: { $ne: focusMember._id },
    })
      .select('_id')
      .lean();
    siblings.forEach((s) => ids.add(String(s._id)));

    const parentDocs = await Member.find({ _id: { $in: focusMember.parents } })
      .select('spouses')
      .lean();
    parentDocs.forEach((p) => {
      (p.spouses || []).forEach((s) => ids.add(String(s)));
    });
  }

  let frontier = (focusMember.children || []).map(String);
  for (let generation = 1; generation <= depth; generation += 1) {
    for (const id of frontier) {
      ids.add(id);
    }
    if (generation === depth || frontier.length === 0) {
      break;
    }

    const docs = await Member.find({ _id: { $in: frontier } })
      .select('children spouses')
      .lean();

    const nextFrontier = [];
    for (const doc of docs) {
      (doc.spouses || []).forEach((s) => ids.add(String(s)));
      (doc.children || []).forEach((c) => nextFrontier.push(String(c)));
    }
    frontier = [...new Set(nextFrontier)];
  }

  return uniqueObjectIds([...ids]);
}

module.exports = { collectTreeMemberIds, uniqueObjectIds };
