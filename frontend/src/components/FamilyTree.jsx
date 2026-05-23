import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { toPng } from 'html-to-image';
import { API_BASE } from '../config';
import { buildFamilyGraph, getLayoutedElements } from '../utils/familyGraph';
import {
  Home,
  LayoutGrid,
  Save,
  Download,
  TreePine,
  Sprout,
  ChevronDown,
  ChevronUp,
  User,
  RefreshCw,
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react';
import MemberNode from './MemberNode';
import MarriageBarNode from './MarriageBarNode';
import ConfirmDialog from './ConfirmDialog';
import { CurveEdge } from './edges/FamilyEdges';

const nodeTypes = { member: MemberNode, marriage: MarriageBarNode };
const edgeTypes = { curve: CurveEdge };

function TreeLoading() {
  return (
    <div className="tree-status tree-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" aria-hidden="true" />
      <p>Loading family tree…</p>
      <div className="skeleton-toolbar" aria-hidden="true" />
    </div>
  );
}

function TreeError({ message, onRetry }) {
  return (
    <div className="tree-status tree-error" role="alert">
      <div className="tree-error-icon">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <h2>Could not load tree</h2>
      <p>{message}</p>
      <button className="primary-btn" onClick={onRetry} type="button">
        <RefreshCw size={18} />
        Try again
      </button>
    </div>
  );
}

function FamilyTreeCanvas({ onNodeClick, refreshKey }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeMemberName, setActiveMemberName] = useState('');
  const [rootNodeId, setRootNodeId] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [toolbarOpen, setToolbarOpen] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(max-width: 640px)').matches
  );
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFetched, setSearchFetched] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reactFlowWrapper = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { fitView } = useReactFlow();

  const visibleMemberCount = nodes.filter((n) => n.type === 'member').length;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const reloadTreeRef = useRef(() => {});

  const requestDelete = useCallback((memberId, memberName) => {
    setConfirmDelete({ id: memberId, name: memberName || 'this member' });
  }, []);

  const handleAddParent = useCallback(async (childId, gender) => {
    try {
      await axios.post(API_BASE, { name: `New ${gender === 'Male' ? 'Father' : 'Mother'}`, gender, childId });
      reloadTreeRef.current();
      showToast('Parent added');
    } catch (e) {
      console.error('Error adding parent', e);
      showToast('Could not add parent', 'error');
    }
  }, [showToast]);

  const handleAddSpouse = useCallback(async (memberId) => {
    try {
      await axios.post(API_BASE, { name: 'New Spouse', spouseId: memberId });
      reloadTreeRef.current();
      showToast('Spouse added');
    } catch (e) {
      console.error('Error adding spouse', e);
      showToast('Could not add spouse', 'error');
    }
  }, [showToast]);

  const handleAddChild = useCallback(async (memberId) => {
    try {
      await axios.post(API_BASE, { name: 'New Child', parentId: memberId });
      reloadTreeRef.current();
      showToast('Child added');
    } catch (e) {
      console.error('Error adding child', e);
      showToast('Could not add child', 'error');
    }
  }, [showToast]);

  const fetchInitialRoot = async () => {
    setError(null);
    try {
      const response = await axios.get(API_BASE);
      const data = response.data;
      if (data && data.length > 0) {
         setIsEmpty(false);
         const firstId = data[0]._id;
         setRootNodeId((prev) => prev || firstId);
         setActiveNodeId((prev) => prev || firstId);
      } else {
         setIsEmpty(true);
         setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch initial node', err);
      setError('Unable to reach the server. Make sure the backend is running on port 5001.');
      setLoading(false);
    }
  };

  const buildGraph = useCallback((filteredData, focusId) => {
    if (!focusId || filteredData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const focusMember = filteredData.find((m) => m._id === focusId);
    setActiveMemberName(focusMember?.name || '');

    const { nodes: graphNodes, edges: graphEdges } = buildFamilyGraph(
      filteredData,
      focusId,
      {
        onAddParent: handleAddParent,
        onAddSpouse: handleAddSpouse,
        onAddChild: handleAddChild,
        onEdit: onNodeClick,
        onDelete: requestDelete,
      }
    );

    const layouted = getLayoutedElements(graphNodes, graphEdges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [onNodeClick, handleAddParent, handleAddSpouse, handleAddChild, requestDelete]);

  const fetchActiveTree = useCallback(async () => {
    if (!activeNodeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/tree/${activeNodeId}`);
      const treeData = response.data;
      buildGraph(treeData, activeNodeId);
      setTimeout(() => {
        fitView({ padding: 0.25, duration: 600, maxZoom: 0.95 });
      }, 80);
    } catch (err) {
      console.error('Failed to fetch tree data', err);
      setError('Failed to load this branch of the tree.');
    } finally {
      setLoading(false);
    }
  }, [activeNodeId, buildGraph, fitView]);

  reloadTreeRef.current = fetchActiveTree;

  useEffect(() => {
    setLoading(true);
    fetchInitialRoot();
  }, [refreshKey]);

  useEffect(() => {
    if (!isEmpty && activeNodeId) {
      fetchActiveTree();
    }
  }, [activeNodeId, refreshKey, isEmpty]);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id: memberId } = confirmDelete;
    setConfirmDelete(null);
    try {
      await axios.delete(`${API_BASE}/${memberId}`);
      if (memberId === activeNodeId) {
          setActiveNodeId(rootNodeId !== memberId ? rootNodeId : null);
      }
      showToast('Member removed');
      await fetchInitialRoot();
      if (activeNodeId && activeNodeId !== memberId) {
        fetchActiveTree();
      }
    } catch (e) {
      console.error('Error deleting node', e);
      showToast('Could not delete member', 'error');
    }
  };

  const createFirstAncestor = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_BASE, {
        name: 'Prahlad Mishra',
        gender: 'Male',
        details: {}
      });

      const newId = response.data._id;
      setRootNodeId(newId);
      setActiveNodeId(newId);
      setIsEmpty(false);
      showToast('First ancestor created');
    } catch (e) {
      console.error('Failed to create root', e);
      showToast('Could not create ancestor', 'error');
      setLoading(false);
    }
  };

  const handleHome = () => {
    if (rootNodeId) setActiveNodeId(rootNodeId);
  };

  const handleRecenter = () => { fetchActiveTree(); };

  const fetchAllMembers = useCallback(async () => {
    if (searchFetched) return;
    setSearchLoading(true);
    try {
      const response = await axios.get(API_BASE);
      setAllMembers(Array.isArray(response.data) ? response.data : []);
      setSearchFetched(true);
    } catch (err) {
      console.error('Failed to fetch members for search', err);
      setAllMembers([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchFetched]);

  const searchMatches = searchQuery.trim()
    ? allMembers.filter((m) =>
        (m.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const handleSearchFocus = () => {
    setSearchOpen(true);
    fetchAllMembers();
  };

  const handleSearchSelect = (member) => {
    setActiveNodeId(member._id);
    setActiveMemberName(member.name || '');
    setSearchQuery('');
    setSearchOpen(false);
    searchInputRef.current?.blur();
  };

  const handleNodeSelect = useCallback((event, node) => {
      if (node.type === 'member') {
        setActiveNodeId(node.id);
        if (node.data?.name) setActiveMemberName(node.data.name);
        onNodeClick?.(node.data);
      }
  }, [onNodeClick]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (isEmpty || loading) return;
      e.preventDefault();
      setToolbarOpen(true);
      setSearchOpen(true);
      fetchAllMembers();
      requestAnimationFrame(() => searchInputRef.current?.focus());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEmpty, loading, fetchAllMembers]);

  const handleSaveTree = async () => {
    try {
      const payload = nodes.map(n => ({ id: n.id, type: n.type, position: n.position }));
      await axios.put(`${API_BASE}/positions/save`, { nodes: payload });
      showToast('Layout positions saved');
    } catch (e) {
      console.error('Save failed', e);
      showToast('Could not save positions', 'error');
    }
  };

  const handleDownload = useCallback(() => {
    if (reactFlowWrapper.current === null) return;
    toPng(reactFlowWrapper.current, { filter: (node) => !(node?.classList?.contains('react-flow__panel')) })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'family-tree-focus.png';
        link.href = dataUrl;
        link.click();
      })
      .then(() => showToast('Tree image downloaded'))
      .catch(e => {
        console.error('Error downloading image', e);
        showToast('Download failed', 'error');
      });
  }, [showToast]);

  const onNodeDragStop = useCallback((event, node) => {
    setNodes((ns) => ns.map((n) => (n.id === node.id ? node : n)));
  }, [setNodes]);

  if (error && isEmpty) {
    return (
      <div className="tree-container">
        <TreeError message={error} onRetry={fetchInitialRoot} />
      </div>
    );
  }

  if (isEmpty && !loading) {
    return (
      <div className="tree-container empty-state">
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <TreePine size={32} strokeWidth={1.5} />
          </div>
          <h2>Start your family tree</h2>
          <p>
            Create the first ancestor to begin mapping generations. You can add parents,
            spouses, and children from any member card.
          </p>
          <button className="primary-btn" onClick={createFirstAncestor} type="button" disabled={loading}>
            <Sprout size={18} />
            {loading ? 'Creating…' : 'Create first ancestor'}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-container">
        <TreeError message={error} onRetry={fetchActiveTree} />
      </div>
    );
  }

  return (
    <div className="tree-container" ref={reactFlowWrapper}>
      <div className="app-header">
        <div className="app-header-icon">
          <TreePine size={16} strokeWidth={2} />
        </div>
        <div>
          <h1>Family Tree</h1>
          <span>Click a member to view · Press / to search</span>
        </div>
      </div>

      {activeMemberName && (
        <div className="viewing-chip" aria-live="polite">
          <User size={14} aria-hidden="true" />
          <span>Viewing</span>
          <strong>{activeMemberName}</strong>
          {!loading && visibleMemberCount > 0 && (
            <span className="stats-chip" title="Members shown in this branch">
              {visibleMemberCount} {visibleMemberCount === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>
      )}

      {loading && <TreeLoading />}

      {toast && (
        <div className={`toast ${toast.type} visible`} role="status">
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Remove family member?"
        message={
          confirmDelete
            ? `“${confirmDelete.name}” will be permanently removed from the tree. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeSelect}
        defaultEdgeOptions={{ type: 'curve', zIndex: 0 }}
        connectionLineType="bezier"
        elevateEdgesOnSelect
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        minZoom={0.25}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className={loading ? 'react-flow-loading' : ''}
      >
        <Panel position="top-left" className={`global-toolbar ${toolbarOpen ? 'expanded' : 'collapsed'}`}>
          <div className="toolbar-header">
            <span className="toolbar-section-label">Tools</span>
            <button
              type="button"
              className="toolbar-toggle"
              onClick={() => setToolbarOpen((o) => !o)}
              aria-expanded={toolbarOpen}
              aria-label={toolbarOpen ? 'Collapse toolbar' : 'Expand toolbar'}
            >
              {toolbarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {activeMemberName && (
            <div className="toolbar-active-member" title="Focused member">
              <User size={14} aria-hidden="true" />
              <span className="toolbar-active-label">Focus</span>
              <span className="toolbar-active-name">{activeMemberName}</span>
            </div>
          )}

          <div className={`toolbar-body ${toolbarOpen ? '' : 'hidden'}`}>
            <div className="toolbar-section-label">Search</div>
            <div className="member-search" ref={searchContainerRef}>
              <div className="member-search-input-wrap">
                <Search size={14} className="member-search-icon" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  className="member-search-input"
                  placeholder="Find a member…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                    fetchAllMembers();
                  }}
                  onFocus={handleSearchFocus}
                  aria-label="Search family members"
                  aria-expanded={searchOpen && searchQuery.trim().length > 0}
                  aria-controls="member-search-results"
                  autoComplete="off"
                />
                {searchLoading && (
                  <Loader2 size={14} className="member-search-spinner" aria-hidden="true" />
                )}
              </div>
              {searchOpen && searchQuery.trim() && (
                <ul
                  id="member-search-results"
                  className="member-search-dropdown"
                  role="listbox"
                >
                  {searchLoading && !searchFetched ? (
                    <li className="member-search-status" role="option">Loading members…</li>
                  ) : searchMatches.length === 0 ? (
                    <li className="member-search-status" role="option">No matching members</li>
                  ) : (
                    searchMatches.slice(0, 12).map((m) => (
                      <li key={m._id} role="option">
                        <button
                          type="button"
                          className="member-search-option"
                          onClick={() => handleSearchSelect(m)}
                        >
                          <span className="member-search-name">{m.name || 'Unknown'}</span>
                          {m.nickname && (
                            <span className="member-search-nickname">{m.nickname}</span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              <p className="member-search-hint">
                <kbd>/</kbd> to focus search
              </p>
            </div>

            <div className="toolbar-section-label">Navigation</div>
            <div className="toolbar-actions">
              <button className="toolbar-btn" onClick={handleHome} type="button">
                <Home size={16} /> Home
              </button>
              <button className="toolbar-btn" onClick={handleRecenter} type="button">
                <LayoutGrid size={16} /> Recenter layout
              </button>
            </div>
            <div className="toolbar-section-label">Export</div>
            <div className="toolbar-actions">
              <button className="toolbar-btn toolbar-btn-primary" onClick={handleSaveTree} type="button">
                <Save size={16} /> Save positions
              </button>
              <button className="toolbar-btn" onClick={handleDownload} type="button">
                <Download size={16} /> Download image
              </button>
            </div>
            <p className="toolbar-hint">Drag nodes to adjust layout, then save.</p>
          </div>
        </Panel>
        <Panel position="bottom-left" className="tree-legend">
          <div className="tree-legend-title">Connections</div>
          <div className="tree-legend-item">
            <span className="tree-legend-curve tree-legend-parent" aria-hidden="true" />
            <span>Parent / child</span>
          </div>
          <div className="tree-legend-item">
            <span className="tree-legend-curve tree-legend-spouse" aria-hidden="true" />
            <span>Spouse</span>
          </div>
        </Panel>
        <Background gap={24} size={1.5} color="#e3d9c8" />
        <Controls showInteractive={false} />
        <MiniMap
          zoomable
          pannable
          nodeColor={(n) => (n.type === 'marriage' ? 'transparent' : '#b8a990')}
          maskColor="rgba(244, 239, 230, 0.88)"
        />
      </ReactFlow>
    </div>
  );
}

export default function FamilyTree(props) {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvas {...props} />
    </ReactFlowProvider>
  );
}
