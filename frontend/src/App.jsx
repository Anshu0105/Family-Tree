import React, { useState } from 'react';
import FamilyTree from './components/FamilyTree';
import MemberDrawer from './components/MemberDrawer';
import './index.css';

function App() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [key, setKey] = useState(0); // to force re-render from child update

  const handleNodeClick = (memberData) => {
    setSelectedMember(memberData);
    setDrawerOpen(true);
  };

  const handleUpdate = (updatedMember) => {
    setSelectedMember(updatedMember);
    setKey((prev) => prev + 1); // Refresh tree data while drawer stays open
  };

  return (
    <div className="App">
      <FamilyTree key={key} onNodeClick={handleNodeClick} />
      <MemberDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        member={selectedMember} 
        onUpdate={handleUpdate} 
      />
    </div>
  );
}

export default App;
