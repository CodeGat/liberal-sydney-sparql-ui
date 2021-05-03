import React from 'react';
import './App.css';
import Canvas from "./canvas/Canvas";
import SideBar from "./sidebar/SideBar";
import {AnimateSharedLayout} from "framer-motion";
import Node from "./canvas/Node";
import {intersect, shape} from "svg-intersections";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {type: '', id: '', content: '', meta: ''},
      transferredSuggestion: {exists: false},
      lastReferencedUnknown: -1,
      lastReferencedUnknownAwaitingClass: false,
      nodeCounter: 0,
      edgeCounter: 0,
      tempEdge: {completing: false, x: 0, y: 0},
      graph: {nodes: [], edges: []}
    };
  }


  /**
   *
   * @param {string} type - whether the object changed was a
   *          node (specified by it's variant), edge or datatype.
   * @param {number} id - id of the given changed object.
   * @param {string} content - the changed input of the object.
   * @param {Object} meta - metadata of the selected item.
   */
  handleSelectedItemChange = (type, id, content, meta) => {
    this.setState({selected: {type: type, id: id, content: content, meta: meta}});
  }

  /**
   *
   * @param type
   * @param elem
   * @param point
   */
  handleTransferSuggestionToCanvas = (type, elem, point) => {
    const { lastReferencedUnknownAwaitingClass, lastReferencedUnknown } = this.state;
    const suggestionToTransfer = {
      exists: true,
      type: type,
      elem: elem,
      point: point
    };
    if (lastReferencedUnknownAwaitingClass){
      suggestionToTransfer.amalgamInfo = {id: lastReferencedUnknown, amalgamType: 'UnknownClassAmalgam'};
    }

    this.setState({transferredSuggestion: suggestionToTransfer});
    if (type === 'edgeKnown' && elem.label === 'type') {
      this.setState(old => ({lastReferencedUnknown: old.selected.id, lastReferencedUnknownAwaitingClass: true}));
    }
  }

  handleAcknowledgedSuggestion = () => {
    this.setState({transferredSuggestion: {exists: false}, lastReferencedUnknownAwaitingClass: false});
  }

  /**
   * Creates the underlying representation of a node to be kept in this.state until it can be rendered by the Node class
   * @param {number} x - the top-left x-value that the position of the node will be based on
   * @param {number} y - the top-left y-value that the position of the node will be based on
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
      id: nodeCounter + 1, type: type, content: content, isOptional: false, amalgam: null
    };

    this.setState(old => ({
      nodeCounter: old.nodeCounter + 1,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));

    if (type !== 'nodeUnf') {
      this.handleSelectedItemChange(type, nodeCounter + 1, content,  null);
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
      type: content === '?' ? 'edgeUnknown' : 'edgeKnown', isOptional: false,
      subject: {id: subjectId, intersectX: subjectPos.midX, intersectY: subjectPos.midY},
      object: {},
      complete: false
    }

    this.setState(old => ({
      edgeCounter: old.edgeCounter + 1,
      graph: {
        ...old.graph,
        edges: [...old.graph.edges, newEdge]
      },
      tempEdge: {completing: true, x: subjectPos.midX + 1, y: subjectPos.midY + 1}
    }));

    this.handleSelectedItemChange(content === '?' ? 'edgeUnknown' : 'edgeKnown', edgeCounter + 1, content, null);
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
    const nodeVariant = Node.variants['nodeUri'](false);
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

  render(){
    const { selected, transferredSuggestion, graph, tempEdge } = this.state;

    return (
      <AnimateSharedLayout>
        <div className="App">
          <Canvas selected={selected} graph={graph} tempEdge={tempEdge}
                  transferredSuggestion={transferredSuggestion}
                  createNode={this.createNode} createEdge={this.createEdge}
                  deleteNode={this.deleteNode} deleteEdge={this.deleteEdge}
                  changeEdgeState={this.changeEdgeState} changeNodeState={this.changeNodeState}
                  updateEdgeIntersections={this.updateEdgeIntersections}
                  moveEdgePlacement={this.moveEdgePlacement} completeEdge={this.completeEdge}
                  onSelectedItemChange={this.handleSelectedItemChange}
                  acknowledgeTransferredSuggestion={this.handleAcknowledgedSuggestion}/>
          <SideBar selected={selected} graph={graph}
                   changeNodeState={this.changeNodeState}
                   onSelectedItemChange={this.handleSelectedItemChange}
                   onTransferSuggestionToCanvas={this.handleTransferSuggestionToCanvas}/>
        </div>
      </AnimateSharedLayout>
    );
  }
}

export default App;
