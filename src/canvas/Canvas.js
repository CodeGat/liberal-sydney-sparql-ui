import React from "react";
import { intersect, shape } from "svg-intersections";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import arrow from './arrow_icon.png';

//todo: where to store the underlying SPARQL representation?
// this.state.modes: drag, edge, node
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeCounter: 0,
      edgeCounter: 0,
      mode: 'drag',
      edgeCompleting: false,
      nodeCompleting: false,
      graph: {nodes: [], edges: []},
      testpath: '',
      testcircle: ''
    };
  }

  /**
   * this.state.graph:
   * NEW: {nodes: [{id, type, isOptional, content, midX, midY, x, y}...]
   *       edges: [{id, type, isOptional, content, subject: {id, intersectX, intersectY}, object: {id, intersectX, intersectY}, done}]}
   */

  /**
   * If a transferred suggestion exists, find out it's type (Node or Edge) and how it will connect to the element it
   *   is making a suggestion for.
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.transferredSuggestion.exists && this.props.transferredSuggestion.exists) {
      const { nodes, edges } = this.state.graph;
      const { elem, type } = this.props.transferredSuggestion;

      this.props.acknowledgeTransferredSuggestion();

      if (type === "edgeKnown") { //if type of transferred suggestion is a known Edge, the selected item is a Node
        const selectedNode = nodes.find(node => node.id === this.props.selected.id);

        if (selectedNode){
          const prefixedEdgeLabel = (elem.prefix !== '' ? elem.prefix + ':' : '') + elem.label;
          const selectedNodePos = {midX: selectedNode.midX, midY: selectedNode.midY};

          this.createEdge(prefixedEdgeLabel, selectedNode.id, selectedNodePos);
          this.setState({mode: 'edge', edgeCompleting: true});
        } else console.warn("No selected element for Edge to anchor");
      } else if (type === "nodeUri") { // likewise if suggestion is a known Node (a URI), the selected item is an Edge
        const prefixedNodeLabel = (elem.prefix !== '' ? elem.prefix + ":" : '') + elem.name;
        const selectedEdge = edges.find(edge => edge.id === this.props.selected.id);
        const currentUnfNode = nodes.find(node => node.id === selectedEdge.object.id);

        this.changeNodeState(currentUnfNode.id, {content: prefixedNodeLabel, type: type});
        this.updateEdge(selectedEdge, currentUnfNode);
        this.props.onSelectedItemChange({id: currentUnfNode.id, content: prefixedNodeLabel, type: type});
      } else if (type === "nodeLiteral") { // and if the suggestion is a known Node (literal), the selected is an Edge
        const selectedElement = edges.find(edge => edge.id === this.props.selected.id);
        const currentUnfNode = nodes.find(node => node.id === selectedElement.object.id);
        let content = '';

        if (elem.name === 'string') content = '""';
        else if (elem.name === 'int' || elem.name === 'integer') content = '0';

        this.changeNodeState(currentUnfNode.id, {content: content, type: type});
        this.props.onSelectedItemChange({id: currentUnfNode.id, content: content, type: type});
      } else console.warn('unknown type when adding suggestion to canvas');
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
      this.createNode(event.clientX, event.clientY, 'nodeUnknown', "?");
    } else if (mode === "edge") {
      const newNodeId = this.createNode(event.clientX, event.clientY, 'nodeUnf', "");
      const variant = Node.variants['nodeUnf'](false);
      const newNodePos = {
        x: event.clientX - variant.width / 2, y: event.clientY - variant.height / 2,
        midX: event.clientX, midY: event.clientY
      };

      if (edgeCompleting){ // we'll complete the edge with a new, unfinished Node as object
        this.completeEdge(newNodeId, 'nodeUnf', newNodePos);
      } else { // we'll create a new edge with a new, unfinished Node as subject
        this.createEdge('?', newNodeId, newNodePos)
      }
    }
  }

  /**
   * Creates the underlying representation of a node to be kept in this.state until it can be rendered by the Node class
   * @param {number} x - the x-value that the position of the node will be based on
   * @param {number} y - the y-value that the position of the node will be based on
   * @param {string} type - the initial state of the created Node, either being a placeholder ('nodeUnf') or a
   *   fully formed node ('nodeUnknown'/'nodeKnown')
   * @param {string} content - content that the node starts with
   * @returns {number} - id of node just created.
   */
  createNode = (x, y, type, content) => {
    const { nodeCounter } = this.state;
    const variant = Node.variants[type](false);
    const newNode = {
      x: x - variant.width / 2, y: y - variant.height / 2,
      midX: x, midY: y,
      id: nodeCounter + 1, type: type, content: content, isOptional: false
    };

    this.setState(old => ({
      nodeCounter: old.nodeCounter + 1,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));

    if (type !== 'nodeUnf') {
      this.props.onSelectedItemChange({id: nodeCounter + 1, content: content, type: type});
    }

    return nodeCounter + 1;
  }

  /**
   * Creates the representation of a new Edge that has an existing subject Node.
   * @param {string} content - content of the new Edge.
   * @param {number} subjectId - id of the existing Subject Node the Edge is connected to.
   * @param {Object} subjectPos - positional information of the existing Subject Node the Edge is connected to: it's
   *   intersecting x/y (which is just the midpoint of the Subject, for simplicity sake
   */
  createEdge = (content, subjectId, subjectPos) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      content: content,
      from: {id: subjectId, intersectX: subjectPos.midX, intersectY: subjectPos.midY},
      to: {x: subjectPos.midX + 1, y: subjectPos.midY + 1},
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

    this.props.onSelectedItemChange(
      {id: edgeCounter + 1, content: content, type: content === '?' ? 'edgeUnknown' : 'edgeKnown'}
    );
  }

  /**
   * Finalizes the Edge, getting it's intersection with the object Node for more natural arrowheads, and
   *   adds the completed Edge to the Canvas state, ready for another Edge to be added.
   * @param {number} objectId - the id of the Object Node.
   * @param {string} objectType - the type of the Object Node.
   * @param {Object} objectPos - object containing positional data about the Object Node, such as it's
   *   top-left x/y, and midpoint x/y.
   */
  completeEdge = (objectId, objectType, objectPos) => {
    const { nodes, edges } = this.state.graph;
    const edge = edges.find(edge => !edge.complete);

    const subject = nodes.find(node => node.id === edge.from);
    const objectVariant = Node.variants[objectType](false);

    const objectShape = {...objectVariant, x: objectPos.x, y: objectPos.y};
    const pathDef = {d: `M${subject.midX} ${subject.midY} L${objectPos.midX} ${objectPos.midY}`};

    const intersections = intersect(shape("path", pathDef), shape("rect", objectShape));
    const firstIntersect = intersections.points[0];
    const object = {id: objectId, intersectX: firstIntersect.x, intersectY: firstIntersect.y};

    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge => !edge.complete ? {...edge, object: object, complete: true} : edge)
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

  /**
   *
   * @param edgeToUpdate
   * @param connectedNode
   */
    //todo: slight error on intersections
  updateEdge = (edgeToUpdate, connectedNode) => {
    const pathDef = `M${edgeToUpdate.from.x} ${edgeToUpdate.from.y} L${connectedNode.x + Node.nodeHeight/2} ${connectedNode.y + Node.nodeHeight/2}`;
    const nodeShape = {...Node.variants.nodeUri(false), x: connectedNode.x - Node.nodeHeight / 4, y: connectedNode.y - Node.nodeHeight/4};

    console.log(pathDef)
    console.log(nodeShape);

    const intersections = intersect(shape('path', {d: pathDef}), shape('rect', nodeShape));

    this.setState({testpath: pathDef, testcircle: {x: connectedNode.x - Node.nodeHeight/4, y: connectedNode.y - Node.nodeHeight/4}});

    console.log(intersections);

    if (intersections.points[0]) {
      const firstIntersection = intersections.points[0];
      const dest = {id: connectedNode.id, x: firstIntersection.x, y: firstIntersection.y};

      this.setState(old => ({
        graph: {
          ...old.graph,
          edges: old.graph.edges.map(edge =>
            edge.id === edgeToUpdate.id ? {...edge, to: dest} : edge)
        }
      }));
    } else console.warn("couldn't find intersection between selected edge and expanded unf node");
  }

  /**
   * Changes the state of the node with the given id.
   * @param {number} id - id of the node to be changed
   * @param {Object} changes - object of all changes to the nodes state
   */
  changeNodeState = (id, changes) => {
    this.setState(old => ({
      graph: {
        ...old.graph,
        nodes: old.graph.nodes.map(node => node.id === id ? {...node, ...changes} : node)
      }
    }));
  }

  /**
   * Changes the state of the edge with the given id.
   * @param {number} id - id of the edge to be changed
   * @param {Object} changes - object of all changes to the edges state
   */
  changeEdgeState = (id, changes) => {
    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge => edge.id === id ? {...edge, ...changes} : edge)
      }
    }));
  }

  render() {
    const { nodes, edges } = this.state.graph;
    const { mode, edgeCompleting, testpath, testcircle } = this.state;

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
              <Edge id={edge.id} key={edge.id} type={edge.type} isOptional={edge.isOptional} content={edge.content}
                    subject={edge.subject} object={edge.object}
                    onChangeEdgeState={this.changeEdgeState}
                    onSelectedItemChange={this.handleElementChange}/>)}
          </g>
          <g id="nodes">
            {nodes.map(node =>
              <Node id={node.id} key={node.id} x={node.x} y={node.y} midX={node.midX} midY={node.midY} type={node.type}
                    content={node.content} isOptional={node.isOptional}
                    mode={mode} edgeCompleting={edgeCompleting}
                    onChangeNodeState={this.changeNodeState}
                    onSelectedItemChange={this.handleElementChange}
                    onEdgeCreation={this.createEdge}
                    onEdgeCompletion={this.completeEdge} />)}
          </g>
          {testpath !== '' && testcircle !== '' &&
            <Testpath path={testpath} circle={testcircle}/>}
        </svg>
      </div>
    );
  }
}

function Testpath(props){
  return (
    <g>
      <path d={props.path} stroke={'red'} strokeWidth={3} strokeDasharray={0}/>
      <rect x={props.circle.x} y={props.circle.y} width={100} height={100} rx={50} ry={50} stroke={'black'} fill={'transparent'}/>
      <rect x={props.circle.x} y={props.circle.y} width={100} height={100} stroke={'black'} fill={'transparent'}/>
      <rect x={props.circle.x} y={props.circle.y} width={40} height={40} rx={70} ry={70} stroke={'blue'} fill={'transparent'}/>
      <rect x={props.circle.x} y={props.circle.y} width={40} height={40} stroke={'blue'} fill={'transparent'}/>
    </g>
  );
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