import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/** Invisible junction — children connect here; spouses connect to each other directly */
const MarriageJunctionNode = () => (
  <div className="marriage-junction-minimal" aria-hidden="true">
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom"
      isConnectable={false}
    />
  </div>
);

export default memo(MarriageJunctionNode);
