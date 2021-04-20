import React from "react";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import arrow from './arrow_icon.png';
import {AnimatePresence} from "framer-motion";

// this.state.modes: drag, edge, node
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'drag'
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
      const {elem, type, amalgamInfo} = this.props.transferredSuggestion;
      this.props.acknowledgeTransferredSuggestion();

      if (amalgamInfo) {
        if (amalgamInfo.amalgamType === 'UnknownClassAmalgam') {
          this.realiseSuggestedUnknownClassAmalgam(elem, amalgamInfo.id);
        }
      } else if (type === "edgeKnown") { // if type of transferred suggestion is a known Edge, the selected item is a Node
        this.realiseSuggestedEdge(elem);
      } else if (type === "nodeUri") { // likewise if suggestion is a known Node (a URI), the selected item is an Edge
        this.realiseSuggestedUri(elem, type);
      } else if (type === "nodeUnknown") {
        this.realiseSuggestedUnknown(elem);
      } else if (type === "nodeLiteral") { // and if the suggestion is a known Node (literal), the selected is an Edge
        this.realiseSuggestedLiteral(elem, type);
      } else console.warn('unknown type when adding suggestion to canvas');
    }
  }

  /**
   * Create the representation of a '?' node that has an inferred class
   * @param {Object} inferredClass - the Node that is being inferred as the class for the amalgamated '?' Node
   * @param {number} amalgamId - id of the previously-selected Node that the inferredClass will be amalgamated into
   */
  realiseSuggestedUnknownClassAmalgam = (inferredClass, amalgamId) => {
    const {nodes, edges} = this.props.graph;

    const nodeAmalgam = nodes.find(node => node.id === amalgamId);
    const edgeToDelete = edges.find(edge => edge.subject.id === nodeAmalgam.id);
    const amalgamChange = {amalgam: {type: 'UnknownClassAmalgam', inferredClass: inferredClass}};

    this.props.changeNodeState(amalgamId, amalgamChange);
    this.props.deleteNode(edgeToDelete.object.id);
    this.props.deleteEdge(edgeToDelete.id);
    this.props.onSelectedItemChange(nodeAmalgam.type, nodeAmalgam.id, nodeAmalgam.content, amalgamChange);
  }

  /**
   * Gather the necessary information to create the suggestion on canvas with reference to the currently selected Node.
   * @param {Object} suggestion - the suggestion that will be realised.
   */
  realiseSuggestedEdge = (suggestion) => {
    const { nodes } = this.props.graph;
    const selectedNode = nodes.find(node => node.id === this.props.selected.id);

    if (selectedNode){
      const prefixedEdgeLabel = (suggestion.prefix !== '' ? suggestion.prefix + ':' : '') + suggestion.label;
      const selectedNodePos = {midX: selectedNode.midX, midY: selectedNode.midY};

      this.props.createEdge(prefixedEdgeLabel, selectedNode.id, selectedNodePos);
      this.setState({mode: 'edge'});
    } else console.warn("No selected element for Edge to anchor");
  }

  /**
   * Gather the necessary information to create the suggestion on canvas with reference to the currently selected Edge.
   * @param {Object} suggestion - the suggestion that will be realised.
   * @param {string} type - the type of the suggestion.
   */
  realiseSuggestedUri = (suggestion, type) => {
    const { edges, nodes } = this.props.graph;

    const prefixedNodeLabel = (suggestion.prefix !== '' ? suggestion.prefix + ":" : '') + suggestion.name;
    const selectedEdge = edges.find(edge => edge.id === this.props.selected.id);

    if (selectedEdge) { // aka, if there is an edge selected by the user
      const currentUnfNode = nodes.find(node => node.id === selectedEdge.object.id);

      this.props.changeNodeState(currentUnfNode.id, {content: prefixedNodeLabel, type: type});
      this.props.updateEdgeIntersections(selectedEdge, currentUnfNode);
      this.props.onSelectedItemChange(type, currentUnfNode.id, prefixedNodeLabel, null);
    } else { // it must be a base class and we would need to create a new one!
      const newNodeId = this.props.createNode(50, 50, type, suggestion.label);
      this.props.onSelectedItemChange(type, newNodeId, suggestion.label, null);
    }
  }

  /**
   * Gather the necessary information to create the suggestion on canvas (with reference to the currently selected
   *   Edge). The suggestion will be a '?' Node, known as an Unknown.
   * @param {Object} suggestion - teh suggestion that will be realised on the Canvas.
   */
  realiseSuggestedUnknown = (suggestion) => {
    const { nodes, edges } = this.props.graph;

    const selectedEdge = edges.find(edge => edge.id === this.props.selected.id);

    if (selectedEdge){
      const currentUnfNode = nodes.find(node => node.id === selectedEdge.object.id);

      this.props.changeNodeState(currentUnfNode.id, {content: suggestion.label, type: 'nodeUnknown'});
      this.props.updateEdgeIntersections(selectedEdge, currentUnfNode);
      this.props.onSelectedItemChange('nodeUnknown', currentUnfNode.id, suggestion.label, null);
    } else {
      const newNodeId = this.props.createNode(50, 50, 'nodeUnknown', suggestion.label);
      this.props.onSelectedItemChange('nodeUnknown', newNodeId, suggestion.label);
    }
  }

  /**
   * Gather the necessary information to create the suggestion on canvas with reference to the currently selected Edge.
   * @param {Object} suggestion - the suggestion that will be realised.
   * @param {string} type - the type of the suggestion.
   */
  realiseSuggestedLiteral = (suggestion, type) => {
    const { edges, nodes } = this.props.graph;
    const selectedElement = edges.find(edge => edge.id === this.props.selected.id);
    const currentUnfNode = nodes.find(node => node.id === selectedElement.object.id);
    let content = '';

    if (suggestion.name === 'string') content = '""';
    else if (suggestion.name === 'int' || suggestion.name === 'integer') content = '0';

    this.props.changeNodeState(currentUnfNode.id, {content: content, type: type});
    this.props.onSelectedItemChange(type, currentUnfNode.id, content, null);
  }

  /**
   * Propagates a change on canvas to the root - eventually the sidebar
   * @param {string} type - the type of the object modified: either a node, edge or datatype
   * @param {number} id - the canvas id of the modified object
   * @param {string} content - the content that was changed
   * @param {Object} meta - metadata about the given change
   */
  handleElementChange = (type, id, content, meta) => {
    this.props.onSelectedItemChange(type, id, content, meta);
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
    const { mode } = this.state;
    const { edgeCompleting } = this.props;

    if (event.defaultPrevented) return;

    if (mode === "node") {
      this.props.createNode(event.clientX, event.clientY, 'nodeUnknown', "?");
    } else if (mode === "edge") {
      const newNodeId = this.props.createNode(event.clientX, event.clientY, 'nodeUnf', "");
      const variant = Node.variants['nodeUnf'](false);
      const newNodePos = {
        x: event.clientX - variant.width / 2, y: event.clientY - variant.height / 2,
        midX: event.clientX, midY: event.clientY
      };

      if (edgeCompleting){ // we'll complete the edge with a new, unfinished Node as object
        this.props.completeEdge(newNodeId, 'nodeUnf', newNodePos);
      } else { // we'll create a new edge with a new, unfinished Node as subject
        this.props.createEdge('?', newNodeId, newNodePos)
      }
    }
  }

  render() {
    const { nodes, edges } = this.props.graph;
    const { edgeCompleting } = this.props;
    const { mode } = this.state;

    return (
      <div className="canvas">
        <ModeSelector onModeSelectorChangeTo={this.handleModeSelectChange}/>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny"
             width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
             onMouseMove={edgeCompleting ? this.props.moveEdgePlacement : null} onClick={this.handleCanvasClick}>
          <defs>
            <marker id="arrow" markerWidth={5} markerHeight="7" refX={3.8} refY={3.5} orient="auto">
              <polygon points="0 0, 5 3.5, 0 7" fill={"#8e9094"}/>
            </marker>
          </defs>
          <g id="edges">
            <AnimatePresence>
              {edges.map(edge =>
                <Edge id={edge.id} key={edge.id} type={edge.type} isOptional={edge.isOptional} content={edge.content}
                      subject={edge.subject} object={edge.object}
                      onChangeEdgeState={this.props.changeEdgeState}
                      onSelectedItemChange={this.handleElementChange}/>)}
            </AnimatePresence>
          </g>
          <g id="nodes">
            <AnimatePresence>
              {nodes.map(node =>
                <Node id={node.id} key={node.id} x={node.x} y={node.y} midX={node.midX} midY={node.midY} type={node.type}
                      content={node.content} isOptional={node.isOptional} amalgam={node.amalgam}
                      mode={mode} edgeCompleting={edgeCompleting}
                      onChangeNodeState={this.props.changeNodeState}
                      onSelectedItemChange={this.handleElementChange}
                      onEdgeCreation={this.props.createEdge}
                      onEdgeCompletion={this.props.completeEdge} />)}
            </AnimatePresence>
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