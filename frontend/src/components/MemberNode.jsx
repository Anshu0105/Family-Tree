import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Edit2, Trash2, UserPlus, Heart, Baby } from 'lucide-react';
import { getLifeLabel, isDeceased } from '../utils/memberMeta';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const MemberNode = ({ data }) => {
  const genderClass = data.gender === 'Male' ? 'male' : data.gender === 'Female' ? 'female' : 'neutral';
  const activeClass = data.isActive ? 'active' : '';
  const deceased = isDeceased(data.details);
  const lifeLabel = getLifeLabel(data.details);

  return (
    <div
      className={`member-node ${genderClass} ${activeClass} ${deceased ? 'deceased' : ''}`}
      aria-current={data.isActive ? 'true' : undefined}
    >
      <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} isConnectable={false} />

      <div className="member-avatar" aria-hidden="true">
        {getInitials(data.name)}
      </div>

      <div className="name">{data.name || 'Unknown'}</div>
      {data.nickname && <div className="nickname">{data.nickname}</div>}
      {lifeLabel ? (
        <div className="member-meta member-life">{lifeLabel}</div>
      ) : (
        data.gender && <div className="member-meta">{data.gender}</div>
      )}
      {deceased && <div className="member-memorial" aria-label="Deceased">†</div>}

      {data.isActive && (
        <div className="quick-add-container">
          <button
            className="quick-btn"
            onClick={(e) => { e.stopPropagation(); data.onAddParent(data._id, 'Male'); }}
            type="button"
            aria-label="Add father"
          >
            <UserPlus size={11} /> Father
          </button>
          <button
            className="quick-btn"
            onClick={(e) => { e.stopPropagation(); data.onAddParent(data._id, 'Female'); }}
            type="button"
            aria-label="Add mother"
          >
            <UserPlus size={11} /> Mother
          </button>
          <button
            className="quick-btn"
            onClick={(e) => { e.stopPropagation(); data.onAddSpouse(data._id); }}
            type="button"
            aria-label="Add spouse"
          >
            <Heart size={11} /> Spouse
          </button>
          <button
            className="quick-btn"
            onClick={(e) => { e.stopPropagation(); data.onAddChild(data._id); }}
            type="button"
            aria-label="Add child"
          >
            <Baby size={11} /> Child
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="children" style={{ opacity: 0 }} isConnectable={false} />
      <Handle type="source" position={Position.Right} id="spouse" style={{ top: 28, opacity: 0 }} isConnectable={false} />
      <Handle type="target" position={Position.Left} id="spouse-in" style={{ top: 28, opacity: 0 }} isConnectable={false} />

      <div className="node-controls">
        <button
          className="ctrl-btn edit-btn"
          onClick={(e) => { e.stopPropagation(); data.onEdit(data); }}
          title="Edit details"
          aria-label={`Edit ${data.name || 'member'}`}
          type="button"
        >
          <Edit2 size={14} />
        </button>
        <button
          className="ctrl-btn delete-btn"
          onClick={(e) => { e.stopPropagation(); data.onDelete(data._id, data.name); }}
          title="Delete member"
          aria-label={`Delete ${data.name || 'member'}`}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default memo(MemberNode);
