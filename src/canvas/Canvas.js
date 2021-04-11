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
   * NEW: {nodes: [{id, x, y, type, isOptional, content}...] edges: [{id, content, from: id to: id, done}]}
   */

  /**
   * checks if a transferred suggestion needs to be added to the canvas
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.transferredSuggestion.exists && this.props.transferredSuggestion.exists) {
      const { nodes, edges } = this.state.graph;
      const { elem, point, type } = this.props.transferredSuggestion;

      this.props.acknowledgeTransferredSuggestion();

      if (type === "edgeKnown"){
        // if off click is on node do regular createEdgeWithExistingNode else do it anyway (move edge to selected item
        const selectedElement = nodes.find(node => node.id === this.props.selected.id);

        if (selectedElement){
          const nodeInfo = {id: selectedElement.id, content: selectedElement.content};
          const nodeShape = {x: selectedElement.x, y: selectedElement.y};
          const prefixedEdgeLabel = (elem.prefix !== '' ? elem.prefix + ':' : '') + elem.label;

          this.createEdgeWithExistingNode(nodeInfo, nodeShape, prefixedEdgeLabel);
          this.setState({mode: 'edge', edgeCompleting: true});
        } else console.warn("No selected element for Edge to anchor");
      } else if (type === "nodeUri") {
        const prefixedNodeLabel = (elem.prefix !== '' ? elem.prefix + ":" : '') + elem.name;
        const selectedEdge = edges.find(edge => edge.id === this.props.selected.id);
        const currentUnfNode = nodes.find(node => node.id === selectedEdge.to.id);

        this.changeNodeState(currentUnfNode.id, {content: prefixedNodeLabel, type: type});
        this.updateEdge(selectedEdge, currentUnfNode);
        this.props.onSelectedItemChange({id: currentUnfNode.id, content: prefixedNodeLabel, type: type});
        // this.createNode(point.x, point.y, type, prefixedNodeLabel); // creates node to drag point
        // this.createNode(currentUnfNode.x, currentUnfNode.y, type, prefixedNodeLabel); // creates node on top of last unf
      } else if (type === "nodeLiteral"){
        const selectedElement = edges.find(edge => edge.id === this.props.selected.id);
        const currentUnfNode = nodes.find(node => node.id === selectedElement.to.id);
        let content = '';

        if (elem.name === 'string'){
          content = '""';
        } else if (elem.name === 'int' || elem.name === 'integer') {
          content = '0';
        }

        this.changeNodeState(currentUnfNode.id, {content: content, type: type});
        this.props.onSelectedItemChange({id: currentUnfNode.id, content: content, type: type});
        // this.createNode(point.x, point.y, type, content);
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
   * Creates the underlying representation of an Edge whose subject exists. Called from Node.js when the existing Node
   *  was clicked
   * @param nodeInfo {Object} - Object that contains information about the nodes content and id
   * @param {number} nodeInfo.id - the id of the existing node that will be the subject of the new Edge
   * @param {string} nodeInfo.content - the text within the existing Node
   * @param nodeShape {Object}
   * @param {number} nodeShape.x - the x-coordinate of the Node
   * @param {number} nodeShape.y - the y-coordinate of the Node
   * @param {string} content - initial content of the given Edge
   */
  createEdgeWithExistingNode = (nodeInfo, nodeShape, content) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      defaultContent: content,
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
    this.props.onSelectedItemChange(
      {id: edgeCounter + 1, content: content, type: content === '?' ? 'edgeUnknown' : 'edgeKnown'}
    );
  }

  /**
   * Creates the underlying representation of the edge whose subject does not yet exist.
   *  This happens when one clicks on the canvas in 'edge' mode while not in 'edgeCompleting' mode
   * @param {number} x - the x position that spawned the new node
   * @param {number} y - the y position that spawned the new node
   * @param {number} id  - the id of the newly-created node
   */
  createEdgeWithNewNode = (x, y, id) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      defaultContent: '?',
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

    const edgeToComplete = edges.find(edge => !edge.complete);
    const subjectNode = nodes.find(node => node.id === edgeToComplete.from.id);
    const objectNodeShape = {...Node.variants.nodeUnf, x: x - Node.unfWidth / 2, y: y - Node.unfHeight / 2};
    const basicPathDef = `M${subjectNode.x} ${subjectNode.y} L${x} ${y}`; //todo: when adding an edge, it uses the old unf midpoint!

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
              <Edge id={edge.id} key={edge.id}
                    from={nodes.find(x => x.id === edge.from.id)} to={edge.to} defaultContent={edge.defaultContent}
                    onSelectedItemChange={this.handleElementChange}/>)}
          </g>
          <g id="nodes">
            {nodes.map(node =>
              <Node id={node.id} key={node.id} x={node.x} y={node.y} type={node.type}
                    content={node.content} isOptional={node.isOptional}
                    mode={mode} edgeCompleting={edgeCompleting}
                    onChangeNodeState={this.changeNodeState}
                    onSelectedItemChange={this.handleElementChange}
                    onEdgeCreation={this.createEdgeWithExistingNode}
                    onEdgeCompletion={this.completeEdgeWithExistingNode} />)}
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