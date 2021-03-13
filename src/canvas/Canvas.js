import React from "react";
import { intersect, shape } from "svg-intersections";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import arrow from './arrow_icon.png';

//todo: where to store the underlying SPARQL representation?
// this.state.modes: drag, edge, edit
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeCounter: 0,
      edgeCounter: 0,
      mode: 'drag',
      edgeCompleting: false,
      nodeCompleting: false,
      graph: {nodes: [], edges: []}
    };
  }

  /**
   * this.state.graph:
   * {nodes: [{id, x, y, init}...], edges: [{id, from {id, x, y}, to {id, x, y}, done}...]}
   */

  /**
   * checks if a transferred suggestion needs to be added to the canvas
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.transferredSuggestion.exists && this.props.transferredSuggestion.exists) {
      const { elem, point, type } = this.props.transferredSuggestion;

      console.log(this.props.transferredSuggestion);
      this.props.acknowledgeTransferredSuggestion();

      if (type === "edgeKnown"){
        this.createEdgeWithExistingNode();
      } else if (type === "nodeKnown") {
        this.createNode(point.x, point.y, type, elem.name);
      }
    }
  }

  /**
   * Propagates a change on canvas to the root - eventually the sidebar
   * @param {Object} change
   * @param {string} change.type - the type of the object modified: either a node, edge or datatype
   * @param {number} change.id - the canvas id of the modified object
   * @param {string} change.content - the content that was changed
   */
  handleElementChange = (change) => {
    this.props.onSelectedItemChange(change);
  }

  /**
   * the mode of the canvas
   * @param {string} newMode
   */
  handleModeSelectChange = (newMode) => {
    this.setState({mode: newMode});
  }

  /**
   * Method that handles a click to the svg canvas, unless it has been handled by one of the Canvas' children, such as
   *   a node or edge.
   * @param event - the click event
   */
  handleCanvasClick = (event) => {
    const { mode, edgeCompleting } = this.state;

    if (event.defaultPrevented) return;

    if (mode === "node") {
      this.createNode(event.clientX, event.clientY, 'nodeUnknown', "");
    } else if (mode === "edge") {
      const newNodeId = this.createNode(event.clientX, event.clientY, 'nodeUnf', "");
      if (edgeCompleting){
        this.completeEdgeWithNewNode(event.clientX, event.clientY, newNodeId);
      } else {
        this.createEdgeWithNewNode(event.clientX, event.clientY, newNodeId);
      }
    }
  }

  /**
   * Creates the underlying representation of a node to be kept in this.state until it can be rendered by the Node class
   * @param {number} x - the x-value that the position of the node will be based on
   * @param {number} y - the y-value that the position of the node will be based on
   * @param {string} initState - the initial state of the created Node, either being a placeholder ('nodeUnf') or a
   *   fully formed node ('nodeUnknown'/'nodeKnown')
   * @param {string} content - content that the node starts with
   * @returns {number} - id of node just created.
   */
  createNode = (x, y, initState, content) => {
    const { nodeCounter } = this.state;
    const newNode = {x: x, y: y, id: nodeCounter + 1, initState: initState, content: content};

    this.setState(old => ({
      nodeCounter: old.nodeCounter + 1,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));

    return nodeCounter + 1;
  }

  /**
   * Creates the underlying representation of an Edge whose subject exists. Called from Node.js when the existing Node
   *  was clicked
   * @param event - the click event as seen by the existing Node
   * @param nodeInfo {Object} - Object that contains information about the nodes content and id
   * @param {number} nodeInfo.id - the id of the existing node that will be the subject of the new Edge
   * @param {string} nodeInfo.content - the text within the existing Node
   * @param nodeShape {Object}
   * @param {number} nodeShape.x - the x-coordinate of the Node
   * @param {number} nodeShape.y - the y-coordinate of the Node
   */
  createEdgeWithExistingNode = (event, nodeInfo, nodeShape) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      from: {id: nodeInfo.id, content: nodeInfo.content, x: nodeShape.x, y: nodeShape.y},
      to: {x: nodeShape.x + 1, y: nodeShape.y + 1},
      complete: false
    }

    this.setState(old => ({
      edgeCounter: old.edgeCounter + 1,
      graph: {
        ...old.graph,
        edges: [...old.graph.edges, newEdge]
      },
      edgeCompleting: true
    }));
  }

  /**
   * Creates the underlying representation of the edge whose subject does not yet exist.
   *  This happens when one clicks on the canvas in 'edge' mode while not in 'edgeCompleting' mode
   * @param x - the x position that spawned the new node
   * @param y - the y position that spawned the new node
   * @param id {number} - the id of the newly-created node
   */
  createEdgeWithNewNode = (x, y, id) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      from: {id: id},
      to: {x: x + 1, y: y + 1},
      complete: false
    };

    this.setState(old => ({
      edgeCounter: old.edgeCounter + 1,
      graph: {
        ...old.graph,
        edges: [...old.graph.edges, newEdge]
      },
      edgeCompleting: true
    }));
  }

  completeEdgeWithExistingNode = (event, nodeInfo, nodeShape, nodeAux) => {
    const { nodes, edges } = this.state.graph;
    const edge = edges.find(edge => !edge.complete);
    const subjectNode = nodes.find(x => x.id === edge.from.id);
    const incompleteEdgeDef = `M${subjectNode.x} ${subjectNode.y} L${nodeAux.midX} ${nodeAux.midY}`;

    const intersections = intersect(shape("path", {d: incompleteEdgeDef}), shape("rect", nodeShape));
    const firstIntersect = intersections.points[0];

    const dest = {id: nodeInfo.id, x: firstIntersect.x, y: firstIntersect.y};

    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge =>
          !edge.complete ? {...edge, to: dest, complete: true} : edge)
      },
      edgeCompleting: false
    }));
  }

  //todo: find optimisation for all these `find` calls - O(n)
  /**
   *
   * @param x - the x position that spawned the node
   * @param y - the y position that spawned the node
   * @param {number} id - the id of the created node
   */
  completeEdgeWithNewNode(x, y, id) {
    const { nodes, edges } = this.state.graph;
    const edge = edges.find(edge => !edge.complete);
    const subjectNode = nodes.find(node => node.id === edge.from.id);
    const objectNodeX = x - Node.unfWidth / 2;
    const objectNodeY = y - Node.unfHeight / 2;
    const objectNodeShape = {
      x: objectNodeX, y: objectNodeY,
      width: Node.unfWidth, height: Node.unfHeight,
      rx: 70, ry:70
    };
    const basicPathDef = `M${subjectNode.x} ${subjectNode.y} L${x} ${y}`;

    const intersections = intersect(shape('path', {d: basicPathDef}), shape('rect', objectNodeShape));
    const firstIntersect = intersections.points[0];
    const dest = {id: id, x: firstIntersect.x, y: firstIntersect.y};

    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge =>
          !edge.complete ? {...edge, to: dest, complete: true} : edge
        )
      },
      edgeCompleting: false
    }));
  }

  moveEdgePlacement = (e) => {
    if (e.defaultPrevented) return;

    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge => !edge.complete ? {...edge, to: {x: e.clientX, y: e.clientY}} : edge)
      }
    }));
  }

  render() {
    const { nodes, edges } = this.state.graph;
    const { mode, edgeCompleting } = this.state;

    return (
      <div className="canvas">
        <ModeSelector onModeSelectorChangeTo={this.handleModeSelectChange}/>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny"
             width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
             onMouseMove={edgeCompleting ? this.moveEdgePlacement : null} onClick={this.handleCanvasClick}>
          <defs>
            <marker id="arrow" markerWidth={5} markerHeight="7" refX={3.8} refY={3.5} orient="auto">
              <polygon points="0 0, 5 3.5, 0 7" fill={"#8e9094"}/>
            </marker>
          </defs>
          <g id="edges">
            {edges.map(edge =>
              <Edge id={edge.id} key={edge.id}
                    from={nodes.find(x => x.id === edge.from.id)} to={edge.to}
                    onSelectedItemChange={this.handleElementChange}/>)}
          </g>
          <g id="nodes">
            {nodes.map(node =>
              <Node id={node.id} key={node.id} x={node.x} y={node.y} init={node.initState}
                    mode={mode} edgeCompleting={edgeCompleting}
                    onSelectedItemChange={this.handleElementChange}
                    onEdgeCreation={this.createEdgeWithExistingNode} onEdgeCompletion={this.completeEdgeWithExistingNode} />)}
          </g>
        </svg>
      </div>
    );
  }
}

function ModeSelector(props){
  return (
    <div className='modeselector-container'>
      <div id="node-select" onClick={e => {e.stopPropagation(); props.onModeSelectorChangeTo("node")}}/>
      <div id="edge-select" onClick={e => {e.stopPropagation(); props.onModeSelectorChangeTo("edge")}}>
        <img src={arrow} alt="Arrow selector"/>
      </div>
      <div id="drag-select" onClick={e => {e.stopPropagation(); props.onModeSelectorChangeTo("drag")}}>
        <p>Drag</p>
      </div>
    </div>
  );
}