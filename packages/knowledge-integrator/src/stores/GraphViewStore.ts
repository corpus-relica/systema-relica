import { makeObservable, observable, action } from "mobx";
// import { Node } from "../types"; // Adjust this import to your actual types location
import { nodeData, edgeData } from "../types";
import { sockSendCC } from "../socket";

class GraphViewStore {
  zoomLevel: number;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: nodeData | null;

  selectedNode: number | null;
  selectedEdge: number | null;
  hoveredNode: number | null;
  hoveredLink: number | null;
  hoveredLinkType: number | null;

  contextMenuFocus: {
    x: number | null;
    y: number | null;
    uid: number | null;
    type: string | null;
  };

  constructor() {
    this.zoomLevel = 1;

    this.cameraPosition = { x: 0, y: 0, z: 0 };
    this.cameraTarget = null;

    this.selectedNode = null;
    this.selectedEdge = null;
    this.hoveredNode = null;
    this.hoveredLink = null;
    this.hoveredLinkType = null;

    this.contextMenuFocus = { x: null, y: null, uid: null, type: null };

    makeObservable(this, {
      zoomLevel: observable,

      cameraPosition: observable,
      cameraTarget: observable,

      selectedNode: observable,
      selectedEdge: observable,
      hoveredNode: observable,
      hoveredLink: observable,
      hoveredLinkType: observable,

      contextMenuFocus: observable,

      setZoomLevel: action,
      selectNode: action,
      selectEdge: action,

      // handleNodeClick: action,
      handleNodeHover: action,
      handleLinkHover: action,

      handleContextMenuTrigger: action,
      closeContextMenu: action,
    });
  }

  setZoomLevel(zoom: number) {
    this.zoomLevel = zoom;
  }

  // Note to self: this is fuct up, DO NOT LEAVE IT LIKE THIS
  // *new* Note to self: ...why is this fuct up again?

  // setSelectedEntity(uid: number) {
  //   this.selectedNode = uid;
  // }

  selectNode = (id: number) => {
    // this.selectedNode = id;
    // nousSocket.emit("selectNode", id);
    // sockSendCC("user", "loadEntity", { uid: id });
    sockSendCC("user", "selectEntity", { uid: id });
  };

  selectEdge = (id: number) => {
    sockSendCC("user", "selectFact", { uid: id });
  };

  selectNone = () => {
    sockSendCC("user", "selectNone", {});
  };

  // end fuct up

  handleNodeHover = (node: nodeData | null) => {
    this.hoveredNode = node?.id || null;
  };

  handleLinkHover = (link: edgeData | null) => {
    this.hoveredLink = link?.id || null;
  };

  handleContextMenuTrigger = (uid: number, type: string, event: MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;
    this.contextMenuFocus = { x, y, uid, type };
  };

  closeContextMenu = () => {
    this.contextMenuFocus = { x: null, y: null, uid: null, type: null };
  };
}

export default GraphViewStore;

// const handleNodeClick = useCallback(
// );

// const handleNodeHover = useCallback((node) => {
//   // highlightNodes.clear();
//   // highlightLinks.clear();
//   // if (node) {
//   //   highlightNodes.add(node);
//   //   // node.neighbors.forEach((neighbor) => highlightNodes.add(neighbor));
//   //   // node.links.forEach((link) => highlightLinks.add(link));
//   // }
//   // setHoverNode(node || null);
//   // updateHighlight();
// }, []);

// const handleLinkHover = useCallback((link, prevLink) => {
//   // highlightNodes.clear();
//   if (link && link.id !== highlightLink?.id) {
//     console.log(link);
//     setHighlightLink(link);
//     console.log("foo");
//     //   highlightNodes.add(link.source);
//     //   highlightNodes.add(link.target);
//   } else {
//     console.log("bar");
//     //   setHighlightNodes(new Set());
//     setHighlightLink(null);
//   }
// }, []);
