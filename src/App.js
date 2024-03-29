import React from 'react';
import './App.css';
import MenuBar from "./MenuBar";
import Canvas from "./canvas/Canvas";
import SideBar from "./sidebar/SideBar";
import {AnimateSharedLayout} from "framer-motion";
import Node from "./canvas/Node";
import {intersect, shape} from "svg-intersections";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {type: '', id: '', content: '', isOptional: false, meta: ''}, // currently selected item
      transferredSuggestion: {exists: false}, // suggestion dragged from the sidebar onto the canvas
      lastReferencedUnknown: -1, // the last ? node created
      lastReferencedUnknownAwaitingClass: false, // the last ? node that required an associated inferred class
      nodeCounter: 0, // nodeCounter for React key requirement on map(...)
      edgeCounter: 0, // edgeCounter for React key requirement on map(...)
      tempEdge: {completing: false, x: 0, y: 0}, // temporary edge definition that is still being completed
      graph: {nodes: [], edges: []}, // the overall state of the canvas
      canvasStateSnapshot: {required: false, id: 0, graph: {}} // snapshot of the above graph to be passed to QueryExecutor
    };
  }

  /**
   * Set the old selected items `selected` property to false and the new one to true, and update the state
   *   of the `selected` element
   * @param {string} type - whether the object changed was a node (specified by it's variant), edge or datatype.
   * @param {number} id - id of the given changed object.
   * @param {string} content - the changed input of the object.
   * @param {boolean} isOptional - is the object SPARQL OPTIONAL?
   * @param {Object} meta - metadata of the selected item.
   */
  handleSelectedItemChange = (type, id, content, isOptional, meta) => {
    const { selected } = this.state;

    // set our old selected item to unselected
    if (selected.type.startsWith('node')) {
      this.changeNodeState(selected.id, {isSelected: false});
    } else {
      this.changeEdgeState(selected.id, {isSelected: false});
    }
    // and set our new one to selected!
    if (type.startsWith('node')) {
      this.changeNodeState(id, {isSelected: true});
    } else {
      this.changeEdgeState(id, {isSelected: true});
    }
    this.setState({selected: {type: type, id: id, content: content, isOptional: isOptional, meta: meta}});
  }

  /**
   * Transfer the suggestion from the sidebar onto the Canvas.
   * @param {string} type - type of the transferred suggestion
   * @param {Object} elem - information on the iri, name, label, prefix and expansion of the suggestion
   * @param {Object} point - the last x/y coordinates from perspective of the sidebar (not the svg canvas)
   */
  handleTransferSuggestionToCanvas = (type, elem, point) => {
    const { lastReferencedUnknownAwaitingClass, lastReferencedUnknown } = this.state;
    const suggestionToTransfer = {
      exists: true,
      type: type,
      elem: elem,
      point: point
    };
    if (lastReferencedUnknownAwaitingClass){ //this suggestion is part of an unknown with an associated type
      suggestionToTransfer.amalgamInfo = {id: lastReferencedUnknown, amalgamType: 'UnknownClassAmalgam'};
    }

    this.setState({transferredSuggestion: suggestionToTransfer});
    // the next node to be added will be the type of the rdf:type edge's subject
    if (type === 'edgeKnown' && elem.label === 'type') {
      this.setState(old => ({lastReferencedUnknown: old.selected.id, lastReferencedUnknownAwaitingClass: true}));
    }
  }

  /**
   * The suggestion has been added, set related state back to default.
   */
  handleAcknowledgedSuggestion = () => {
    this.setState({transferredSuggestion: {exists: false}, lastReferencedUnknownAwaitingClass: false});
  }

  /**
   * set canvasStateSnapshot to the current graph, ready to be propagated to the QueryExecutor.
   */
  handleRequestCanvasState = () => {
    const { graph } = this.state;

    this.setState({canvasStateSnapshot: {required: true, graph: graph}});
  }

  /**
   * Creates the underlying representation of a node to be kept in this.state until it can be rendered by the Node class
   * @param {number} x - the top-left x-value that the position of the node will be based on
   * @param {number} y - the top-left y-value that the position of the node will be based on
   * @param {string} type - the initial state of the created Node, either being a placeholder ('nodeUnf') or a
   *   fully formed node ('nodeUnknown'/'nodeKnown')
   * @param {string} content - content that the node starts with
   * @param {boolean} isOptional - is the node SPARQL OPTIONAL?
   * @param {string} [iri] - optional iri for nodes that have type 'nodeUri'
   * @returns {number} - id of node just created.
   */
  createNode = (x, y, type, content, isOptional, iri) => {
    const { nodeCounter } = this.state;
    const variant = Node.variants[type];
    const newNode = {
      x: x - variant.width / 2, y: y - variant.height / 2,
      midX: x, midY: y,
      id: nodeCounter + 1, type: type, content: content, isOptional: isOptional, amalgam: null,
      isSelected: false
    };

    if (iri) newNode.iri = iri;

    this.setState(old => ({
      nodeCounter: old.nodeCounter + 1,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));

    if (type !== 'nodeUnf') {
      this.handleSelectedItemChange(type, nodeCounter + 1, content, isOptional,  null);
    }

    return nodeCounter + 1;
  }

  /**
   * Creates the representation of a new Edge that has an existing subject Node.
   * @param {string} content - content of the new Edge.
   * @param {string} [iri] - iri of the content if the type of the edge is 'edgeUri'.
   * @param {number} subjectId - id of the existing Subject Node the Edge is connected to.
   * @param {Object} subjectPos - positional information of the existing Subject Node the Edge is connected to: it's
   *   intersecting x/y (which is just the midpoint of the Subject, for simplicity sake
   */
  createEdge = (content, iri, subjectId, subjectPos) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      content: content,
      type: content === '?' ? 'edgeUnknown' : 'edgeKnown', isOptional: false,
      subject: {id: subjectId, intersectX: subjectPos.midX, intersectY: subjectPos.midY},
      object: {},
      complete: false,
      isSelected: false
    }

    if (iri) newEdge.iri = iri;

    this.setState(old => ({
      edgeCounter: old.edgeCounter + 1,
      graph: {
        ...old.graph,
        edges: [...old.graph.edges, newEdge]
      },
      tempEdge: {completing: true, x: subjectPos.midX + 1, y: subjectPos.midY + 1}
    }));

    this.handleSelectedItemChange(
      content === '?' ? 'edgeUnknown' : 'edgeKnown', edgeCounter + 1, content, false,null
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

    const subject = nodes.find(node => node.id === edge.subject.id);
    const objectVariant = Node.variants[objectType];

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
      tempEdge: {completing: false}
    }));
  }

  /**
   * the Edge arrowhead follows the users mouse as they find a suitable place to finish it.
   * @param e - event that triggered the function.
   */
  moveEdgePlacement = (e) => {
    if (e.defaultPrevented) return;

    this.setState({tempEdge: {completing: true, x: e.clientX, y: e.clientY}});
  }

  /**
   * Updates the given Edges intersection points due to expansion of a node from unf to known/unknown
   * @param {Object} edgeToUpdate - the Edge whose intersection points need to be updated
   * @param {Object} objectNode - the Object Node whose boundary has changed
   */
  updateEdgeIntersections = (edgeToUpdate, objectNode) => {
    const subX = edgeToUpdate.subject.intersectX;
    const subY = edgeToUpdate.subject.intersectY;
    const nodeVariant = Node.variants['nodeUri'];
    const updatedObjectNodeX = objectNode.x + nodeVariant.width / 2;
    const updatedObjectNodeY = objectNode.y + nodeVariant.height / 2;

    const pathDef = {d: `M${subX} ${subY} L${updatedObjectNodeX} ${updatedObjectNodeY}`};
    const nodeShape = {...nodeVariant, x: objectNode.x, y: objectNode.y};

    const intersections = intersect(shape('path', pathDef), shape('rect', nodeShape));

    if (intersections.points[0]) {
      const firstIntersection = intersections.points[0];
      const objectChanges = {
        object: {id: objectNode.id, intersectX: firstIntersection.x, intersectY: firstIntersection.y}
      };

      this.changeEdgeState(edgeToUpdate.id, objectChanges);
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

  /**
   * Removes the edge with the given edgeId from the internal state.graph
   * @param {number} edgeId - the id associated with the to-be-deleted edge.
   */
  deleteEdge = (edgeId) => {
    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.filter(edge => edge.id !== edgeId)
      }
    }));
  }

  /**
   * Removes the node with the given nodeId from the internal state.graph
   * @param {number} nodeId - the id associated with the to-be-deleted node.
   */
  deleteNode = (nodeId) => {
    this.setState(old => ({
      graph: {
        ...old.graph,
        nodes: old.graph.nodes.filter(node => node.id !== nodeId)
      }
    }));
  }

  /**
   * Recursively deletes an item and all it's outgoing connections
   * @param {number} id - id of the item to delete
   * @param {string} type - type of the item to delete, allows calling of correct graph modification methods
   * @param {boolean} isFirst - if it's the most shallow iteration, change the node to an 'unf' node if theres no
   *   further connections
   */
  deleteItemCascade = (id, type, isFirst) => {
    const { graph } = this.state;

    if (type.startsWith('node')) { // find all the outgoing edges and recursively delete
      const deletedNodeOutgoingEdges = graph.edges.filter(edge => edge.subject.id === id);
      for (const outgoingEdge of deletedNodeOutgoingEdges) {
        this.deleteItemCascade(outgoingEdge.id, outgoingEdge.type, false);
      }
      if (isFirst && deletedNodeOutgoingEdges.length === 0) { //todo: edge case where if only one node, turns small
        this.changeNodeState(id, {type: 'nodeUnf', content: '', amalgam: null});
      } else {
        this.deleteNode(id);
      }
    } else { // it is an edge and we find the connected node and recursively delete
      const deletedEdge = graph.edges.find(edge => edge.id === id);
      const deletedEdgeObjNode = graph.nodes.find(node => node.id === deletedEdge.object.id);

      if (deletedEdgeObjNode) {
        this.deleteItemCascade(deletedEdgeObjNode.id, deletedEdgeObjNode.type, false);
      }
      this.deleteEdge(id);
    }

    if (isFirst) { // on most shallow recursion, set selected item to incoming item or empty.
      if (type.startsWith('edge')) {
        this.checkOptionalityOnSubjectNodeOfDeletedEdge(id, graph);
      }
      this.findSuitableSelectedItemChange(id, type, graph);
    }
  }

  /**
   * if there are no more OPTIONAL outgoing edges from the subject node of the deleted edge, set the node to not being
   *   optional
   * @param {number} id - id of the deleted edge
   * @param {Object} graph - snapshot of the graph before deletion
   */
  checkOptionalityOnSubjectNodeOfDeletedEdge = (id, graph) => {
    const deletedEdge = graph.edges.find(edge => edge.id === id);
    if (!deletedEdge.isOptional) return;

    const subjNodeOfDeletedEdge = graph.nodes.find(node => node.id === deletedEdge.subject.id);
    const subjNodeEdges = graph.edges.filter(edge => edge.subject.id === subjNodeOfDeletedEdge.id && edge.id !== id);

    if (!subjNodeEdges.some(edge => edge.isOptional)) {
      this.changeNodeState(subjNodeOfDeletedEdge.id, {isOptional: false});
    }
  }

  /**
   * Finds the incoming node or edge off the deleted on, setting it as the selected item
   * @param id - id of the deleted item
   * @param type - type of the deleted item
   * @param graph - graph snapshot at lowest level of recursion (no items deleted yet, so we can access
   *   deleted item data)
   */
  findSuitableSelectedItemChange = (id, type, graph) => {
    if (type.startsWith('node')) {
      const selectedEdge = graph.edges.find(edge => edge.object.id === id);
      if (selectedEdge) {
        this.handleSelectedItemChange(
          selectedEdge.type, selectedEdge.id, selectedEdge.content, selectedEdge.isOptional, null
        );
      } else { // have no selected item
        this.handleSelectedItemChange('', -1, '', false,'');
      }
    } else {
      const deletedEdge = graph.edges.find(edge => edge.id === id);
      const selectedNode = graph.nodes.find(node => node.id === deletedEdge.subject.id);
      this.handleSelectedItemChange(
        selectedNode.type, selectedNode.id, selectedNode.content, selectedNode.isOptional,
        {amalgam: selectedNode.amalgam}
      );
    }
  }

  /**
   * Set graph to the loaded example
   * @param {Object} example - object containing edge/node definitions, as well as current ids
   */
  loadExampleIntoCanvas = (example) => {
    const { nodes, edges, nodeCounter, edgeCounter } = example;

    this.setState({
      nodeCounter: nodeCounter,
      edgeCounter: edgeCounter,
      graph: {nodes: nodes, edges: edges}
    });
  }

  render(){
    const { selected, transferredSuggestion, graph, tempEdge, canvasStateSnapshot } = this.state;

    return (
      <AnimateSharedLayout>
        <div className="App">
          <MenuBar loadExampleIntoCanvas={this.loadExampleIntoCanvas}/>
          <div className='content'>
            <Canvas selected={selected} graph={graph} tempEdge={tempEdge}
                    transferredSuggestion={transferredSuggestion}
                    createNode={this.createNode} createEdge={this.createEdge}
                    deleteNode={this.deleteNode} deleteEdge={this.deleteEdge}
                    changeNodeState={this.changeNodeState} changeEdgeState={this.changeEdgeState}
                    updateEdgeIntersections={this.updateEdgeIntersections}
                    moveEdgePlacement={this.moveEdgePlacement} completeEdge={this.completeEdge}
                    onSelectedItemChange={this.handleSelectedItemChange}
                    acknowledgeTransferredSuggestion={this.handleAcknowledgedSuggestion}/>
            <SideBar selected={selected} graph={graph} canvasStateSnapshot={canvasStateSnapshot}
                     changeNodeState={this.changeNodeState} changeEdgeState={this.changeEdgeState}
                     deleteItemCascade={(id, type) => this.deleteItemCascade(id, type, true)}
                     onSelectedItemChange={this.handleSelectedItemChange}
                     onTransferSuggestionToCanvas={this.handleTransferSuggestionToCanvas}
                     onRequestCanvasState={this.handleRequestCanvasState}/>
          </div>
        </div>
      </AnimateSharedLayout>
    );
  }
}

export default App;
