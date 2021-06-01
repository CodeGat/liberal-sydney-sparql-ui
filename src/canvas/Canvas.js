import React from "react";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import {AnimatePresence} from "framer-motion";

/**
 * The Component that renders the svg canvas, and the Nodes and Edges within
 */
export default class Canvas extends React.Component {

  /**
   * If a suggestion transferred from the suggestion bar exists, find out it's type (Node or Edge) and how it will
   *   connect to the element it is making a suggestion for.
   * @param prevProps - props from the last React state update
   * @param prevState - state from the last React state update
   * @param snapshot  -snapshot of the last React state update
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.transferredSuggestion.exists && this.props.transferredSuggestion.exists) {
      const {elem, type, amalgamInfo} = this.props.transferredSuggestion;
      // tell the SuggestionBar that the suggestion has been added to canvas, so it can generate new ones
      this.props.acknowledgeTransferredSuggestion();

      if (amalgamInfo) {
        if (amalgamInfo.amalgamType === 'UnknownClassAmalgam') {
          this.realiseSuggestedUnknownClassAmalgam(elem, amalgamInfo.id);
        }
      } else if (type === "edgeKnown") { // if type of transferred suggestion is a known Edge, the selected item is a Node
        this.realiseSuggestedEdge(elem);
      } else if (type === "nodeUri") { // likewise if suggestion is a known Node (a URI), the selected item is an Edge
        this.realiseSuggestedUri(elem, type);
      } else if (type === "nodeUnknown") { // similarly for this - the currently selected item is an Edge
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
    this.props.onSelectedItemChange(
      nodeAmalgam.type, nodeAmalgam.id, nodeAmalgam.content, nodeAmalgam.isOptional, amalgamChange
    );
  }

  /**
   * Gather the necessary information to create the suggestion on canvas with reference to the currently selected Node.
   * @param {Object} suggestion - the suggestion that will be realised.
   */
  realiseSuggestedEdge = (suggestion) => {
    const { nodes } = this.props.graph;
    const selectedNode = nodes.find(node => node.id === this.props.selected.id);

    if (selectedNode){
      const prefixedEdgeLabel =
        (suggestion.prefix && suggestion.prefix !== '' ? suggestion.prefix + ':' : '') + suggestion.label;
      const selectedNodePos = {midX: selectedNode.midX, midY: selectedNode.midY};

      this.props.createEdge(prefixedEdgeLabel, suggestion.iri, selectedNode.id, selectedNodePos);
    } else console.warn("No selected element for Edge to anchor");
  }

  /**
   * Gather the necessary information to create the suggestion on canvas with reference to the currently selected Edge.
   * @param {Object} suggestion - the suggestion that will be realised.
   * @param {string} type - the type of the suggestion.
   */
  realiseSuggestedUri = (suggestion, type) => {
    const { edges, nodes } = this.props.graph;

    const prefixedNodeLabel =
      (suggestion.prefix && suggestion.prefix !== '' ? suggestion.prefix + ":" : '') + suggestion.name;
    const selectedEdge = edges.find(edge => edge.id === this.props.selected.id);

    if (selectedEdge) { // aka, if there is an edge selected by the user
      const currentUnfNode = nodes.find(node => node.id === selectedEdge.object.id);

      this.props.changeNodeState(currentUnfNode.id, {content: prefixedNodeLabel, iri: suggestion.iri, type: type});
      this.props.updateEdgeIntersections(selectedEdge, currentUnfNode);
      this.props.onSelectedItemChange(type, currentUnfNode.id, prefixedNodeLabel, currentUnfNode.isOptional, null);
    } else { // it must be a base class and we would need to create a new one!
      const newNodeId = this.props.createNode(50, 100, type, suggestion.label, false, suggestion.iri);
      this.props.onSelectedItemChange(type, newNodeId, suggestion.label, false, null);
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

    if (selectedEdge){ // there is already an existing node connected to the edge - modify that one
      const currentUnfNode = nodes.find(node => node.id === selectedEdge.object.id);

      this.props.changeNodeState(currentUnfNode.id, {content: suggestion.label, type: 'nodeUnknown'});
      this.props.updateEdgeIntersections(selectedEdge, currentUnfNode);
      this.props.onSelectedItemChange(
        'nodeUnknown', currentUnfNode.id, suggestion.label, currentUnfNode.isOptional,  null
      );
    } else { // create a new nodeUnknown node
      const newNodeId = this.props.createNode(50, 100, 'nodeUnknown', suggestion.label, false, null);
      this.props.onSelectedItemChange('nodeUnknown', newNodeId, suggestion.label, false);
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

    if (suggestion.name === 'string' || suggestion.name === 'literal') content = '""';
    else if (suggestion.name === 'int' || suggestion.name === 'integer') content = '0';

    this.props.changeNodeState(currentUnfNode.id, {content: content, type: type});
    this.props.onSelectedItemChange(type, currentUnfNode.id, content, currentUnfNode.isOptional, null);
  }

  /**
   * Propagates a change on canvas to the root - eventually the Apps graph-state
   * @param {string} type - the type of the object modified: either a node, edge or datatype
   * @param {number} id - the canvas id of the modified object
   * @param {string} content - the content that was changed
   * @param {boolean} isOptional - whether the object is SPARQL OPTIONAL
   * @param {Object} meta - metadata about the given change
   */
  handleElementChange = (type, id, content, isOptional, meta) => {
    this.props.onSelectedItemChange(type, id, content, isOptional, meta);
  }

  /**
   * Method that handles a click to the svg canvas, unless it has been handled by one of the Canvas' children, such as
   *   a node or edge.
   * @param event - the click event
   */
  handleCanvasClick = (event) => {
    const { tempEdge } = this.props;

    if (event.defaultPrevented) return;
    if (tempEdge.completing){ // if there is an incomplete edge we'll complete the edge with a new, unfinished Node as object
      const newNodeId = this.props.createNode(event.clientX, event.clientY, 'nodeUnf', "", false, null);
      const variant = Node.variants['nodeUnf'];
      const newNodePos = {
        x: event.clientX - variant.width / 2, y: event.clientY - variant.height / 2,
        midX: event.clientX, midY: event.clientY
      };

      this.props.completeEdge(newNodeId, 'nodeUnf', newNodePos);
    }
  }

  render() {
    const { nodes, edges } = this.props.graph;
    const { tempEdge } = this.props;

    return (
      <div className="canvas">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny"
             width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
             onMouseMove={tempEdge.completing ? this.props.moveEdgePlacement : null} onClick={this.handleCanvasClick}>
          <defs>
            <marker id="arrow" markerWidth={5} markerHeight="7" refX={3.8} refY={3.5} orient="auto">
              <polygon points="0 0, 5 3.5, 0 7" fill={"#8e9094"}/>
            </marker>
          </defs>
          <g id="edges">
            <AnimatePresence>
              {edges.map(edge =>
                <Edge id={edge.id} key={edge.id} type={edge.type} isOptional={edge.isOptional} content={edge.content}
                      subject={edge.subject} object={edge.object} tempEdge={tempEdge} complete={edge.complete}
                      isSelected={edge.isSelected}
                      onChangeEdgeState={this.props.changeEdgeState}
                      onSelectedItemChange={this.handleElementChange}/>)}
            </AnimatePresence>
          </g>
          <g id="nodes">
            <AnimatePresence>
              {nodes.map(node =>
                <Node id={node.id} key={node.id} x={node.x} y={node.y} midX={node.midX} midY={node.midY}
                      type={node.type} content={node.content} isOptional={node.isOptional} amalgam={node.amalgam}
                      isSelected={node.isSelected}
                      onChangeNodeState={this.props.changeNodeState}
                      onSelectedItemChange={this.handleElementChange} />)}
            </AnimatePresence>
          </g>
        </svg>
      </div>
    );
  }
}