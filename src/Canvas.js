import React from "react";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import arrow from './arrow_icon.png';

//todo: where to store the underlying SPARQL representation?
// this.state.modes: drag, edge, edit
//todo: refactor edge methods
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeCounter: 0,
      edgeCounter: 0,
      mode: 'drag',
      edgeCompleting: false,
      graph: {nodes: [], edges: []}
    };
  }

  /**
   * this.state.graph:
   * {nodes: [{id, x, y, init}...], edges: [{id, from, to, done}...]}
   */

  handleNodeChange = (change) => {
    this.props.onSelectedItemChange(change);
  }

  handleEdgeChange = (content) => {
    this.props.onSelectedItemChange(content);
  }

  handleModeSelectChange = (newMode) => {
    this.setState({mode: newMode});
  }

  handleCanvasClick = (event) => {
    const { mode } = this.state;

    if (event.defaultPrevented) return;

    if (mode === "node") {
      this.createNode(event, 'unknown');
    } else if (mode === "edge") {
      this.completeEdge(event);
      this.createNode(event, 'placeholder');
    }
  }

  createNode = (e, initState) => {
    const { nodeCounter } = this.state;
    const newNode = {x: e.clientX, y: e.clientY, id: nodeCounter + 1, initState: initState};

    this.setState(old => ({
      nodeCounter: old.nodeCounter + 1,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));
  }

  createEdge = (node) => {
    const { edgeCounter } = this.state;
    const newEdge = {
      id: edgeCounter + 1,
      from: {x: node.x, y: node.y},
      to: {x: node.x + 1, y: node.y + 1},
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

  completeEdge = (node, e) => {
    this.setState(old => ({
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(edge =>
          !edge.complete ? {...edge, to: {x: e.clientX, y: e.clientY}, complete: true} : edge)
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
            <marker id="arrow" markerWidth={5} markerHeight="7" refX={0} refY={3.5} orient="auto">
              <polygon points="0 0, 5 3.5, 0 7" fill={"#8e9094"}/>
            </marker>
          </defs>
          <g id="edges">
            {edges.map(edge =>
              <Edge id={edge.id} key={edge.id} from={edge.from} to={edge.to}
                    onSelectedItemChange={this.handleEdgeChange}/>)}
          </g>
          <g id="nodes">
            {nodes.map(node =>
              <Node id={node.id} key={node.id} mode={mode} x={node.x} y={node.y} init={node.initState}
                    onSelectedItemChange={this.handleNodeChange}
                    onEdgeAction={(node, e) => edgeCompleting ? this.completeEdge(node, e) : this.createEdge(node)}/>)}
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