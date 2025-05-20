import { useCallback } from "react";
import { useGraphDataStore, useUIStateStore } from "./useStores.js";
import { INodeEntity, IEdgeEntity } from "../types/models.js";

/**
 * Hook to access node data with memoization
 *
 * @returns Memoized node data and related functions
 */
export function useNodeData() {
  const graphDataStore = useGraphDataStore();

  const getNode = useCallback(
    (id: number) => {
      return graphDataStore.getNode(id);
    },
    [graphDataStore]
  );

  const getAllNodes = useCallback(() => {
    return graphDataStore.allNodes;
  }, [graphDataStore]);

  const getNodeCategory = useCallback(
    (id: number) => {
      return graphDataStore.getNodeCategory(id);
    },
    [graphDataStore]
  );

  const getNodeColor = useCallback(
    (id: number) => {
      return graphDataStore.getNodeColor(id);
    },
    [graphDataStore]
  );

  return {
    getNode,
    getAllNodes,
    getNodeCategory,
    getNodeColor,
    nodeCount: graphDataStore.nodeCount,
  };
}

/**
 * Hook to access edge data with memoization
 *
 * @returns Memoized edge data and related functions
 */
export function useEdgeData() {
  const graphDataStore = useGraphDataStore();

  const getEdge = useCallback(
    (id: number) => {
      return graphDataStore.getEdge(id);
    },
    [graphDataStore]
  );

  const getAllEdges = useCallback(() => {
    return graphDataStore.allEdges;
  }, [graphDataStore]);

  const getConnectedEdges = useCallback(
    (nodeId: number) => {
      return graphDataStore.getConnectedEdges(nodeId);
    },
    [graphDataStore]
  );

  return {
    getEdge,
    getAllEdges,
    getConnectedEdges,
    edgeCount: graphDataStore.edgeCount,
  };
}

/**
 * Hook to access selection state with memoization
 *
 * @returns Memoized selection state and related functions
 */
export function useSelectionState() {
  const uiStateStore = useUIStateStore();

  return {
    selectedNode: uiStateStore.selectedNode,
    selectedEdge: uiStateStore.selectedEdge,
    hoveredNode: uiStateStore.hoveredNode,
    hoveredEdge: uiStateStore.hoveredEdge,
    hasSelection: uiStateStore.hasSelection,
    hasHover: uiStateStore.hasHover,
  };
}

/**
 * Hook to access viewport state with memoization
 *
 * @returns Memoized viewport state and related functions
 */
export function useViewportState() {
  const uiStateStore = useUIStateStore();

  return {
    isRunning: uiStateStore.running,
    setIsRunning: uiStateStore.setIsRunning,
    wake: uiStateStore.wake,
    sleep: uiStateStore.sleep,
  };
}

/**
 * Hook to access filter state with memoization
 *
 * @returns Memoized filter state and related functions
 */
export function useFilterState() {
  const uiStateStore = useUIStateStore();

  const toggleCategoryVisibility = useCallback(
    (category: string) => {
      uiStateStore.toggleCategoryVisibility(category);
    },
    [uiStateStore]
  );

  const isCategoryVisible = useCallback(
    (category: string) => {
      return uiStateStore.isCategoryVisible(category);
    },
    [uiStateStore]
  );

  const setSearchTerm = useCallback(
    (term: string) => {
      uiStateStore.setSearchTerm(term);
    },
    [uiStateStore]
  );

  return {
    visibleCategories: uiStateStore.getVisibleCategories,
    toggleCategoryVisibility,
    isCategoryVisible,
    searchTerm: uiStateStore.getSearchTerm,
    setSearchTerm,
    nodeMatchesFilters: uiStateStore.nodeMatchesFilters,
  };
}

/**
 * Hook to get filtered nodes based on current filters
 *
 * @returns Filtered nodes array
 */
export function useFilteredNodes() {
  const { getAllNodes, getNodeCategory } = useNodeData();
  const { nodeMatchesFilters, searchTerm } = useFilterState();

  const filteredNodes = getAllNodes().filter((node) =>
    nodeMatchesFilters(node.id, getNodeCategory(node.id), node.name)
  );

  return {
    filteredNodes,
    searchTerm,
  };
}

/**
 * Hook to get connected nodes for a selected node
 *
 * @param nodeId The ID of the node to get connections for
 * @returns Connected nodes and edges
 */
export function useNodeConnections(nodeId: number | null) {
  const graphDataStore = useGraphDataStore();

  if (nodeId === null) {
    return {
      connectedNodes: [] as INodeEntity[],
      connectedEdges: [] as IEdgeEntity[],
    };
  }

  const connectedNodes = graphDataStore.getConnectedNodes(nodeId);
  const connectedEdges = graphDataStore.getConnectedEdges(nodeId);

  return {
    connectedNodes,
    connectedEdges,
  };
}
