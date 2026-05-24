import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * Marriage heart node — sits between spouses and provides the source handle
 * from which children's edges originate. Rendered as a ❤ icon that visually
 * sits on top of the spouse edge, creating the [L] ——❤—— [R] visual.
 */
const MarriageBarNode = () => (
  <div className="marriage-heart-node" aria-hidden="true">
    <div className="marriage-heart-icon">❤</div>
    <Handle
      type="source"
      id="bottom"
      position={Position.Bottom}
      style={{ opacity: 0, width: 2, height: 2, minWidth: 0, minHeight: 0 }}
      isConnectable={false}
    />
  </div>
);

export default memo(MarriageBarNode);
