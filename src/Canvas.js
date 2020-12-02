import React from "react";
import "./Canvas.css"
import Node from "./Node"
import Edge from "./Edge"
import arrow from './arrow_icon.png';

//todo: where to store the underlying SPARQL representation?
// this.state.modes: drag, edge, edit, edge-create
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeCounter: 0,
      edgeCounter: 0,
      mode: 'drag',
      graph: {nodes: [], edges: []}
    };
  }

  /**
   * this.state.graph:
   * {nodes: [{id, x, y, init}...], edges: [{id, from, to, done}...]}
   */

  /**
   *
   * @param change
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

  handleCanvasClick = (e) => {
    const { mode } = this.state;

    if (mode === "edge"){
      this.handleEdgeConfirm(e);
    } else if (mode === "node"){
      this.handleNodeCreate(e, "unknown");
    }
  }

  //todo: edge creation and confirmation are broken
  handleEdgeCreation = (initialNode) => {
    this.setState(old => ({
      ...old,
      graph: {
        ...old.graph,
        edges: [...old.graph.edges, {done:false, from: initialNode, to: initialNode}]
      },
      mode: "edge-create"
    }));
    console.log(this.state);
  }

  handleEdgePlacement  = (e) => {
    this.setState(old => ({
      ...old,
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(el =>
          el.done ? el : {...el, to: {x: e.clientX, y: e.clientY}})
      }
    }));
  }

  handleEdgeConfirm = (e) => {
    this.setState(old => ({
      ...old,
      graph: {
        ...old.graph,
        edges: old.graph.edges.map(el =>
          el.done ? el : {...el, done: true, to: {x: e.clientX, y: e.clientY}})
      },
      mode: "node"
    }));
    this.handleNodeCreate(e, "unfinished");
  }

  handleNodeCreate = (e, initState) => {
    const nextNodeId = this.state.nodeCounter + 1;
    const newNode = {x: e.clientX, y: e.clientY, id: nextNodeId, initState: initState};

    this.setState(old => ({
      ...old,
      nodeCounter: nextNodeId,
      graph: {
        ...old.graph,
        nodes: [...old.graph.nodes, newNode]
      }
    }));
    console.log("After node create: ");
    console.log(this.state);
  }

  render() {
    const { nodes, edges } = this.state.graph;
    const { mode } = this.state;

    return (
      <div className="canvas"
           onMouseMove={mode === "edge-create" ? this.handleEdgePlacement : null} onClick={this.handleCanvasClick}>
        <ModeSelector onModeSelectorChangeTo={this.handleModeSelectChange}/>
        {nodes.map(node =>
          <Node id={node.id} key={node.id} mode={mode} x={node.x} y={node.y} init={node.initState}
                onSelectedItemChange={this.handleNodeChange} onEdgeCreation={this.handleEdgeCreation}/>)}
        {edges.map((edge, ix) =>
          <Edge id={ix} key={ix} from={edge.from} to={edge.to} onSelectedItemChange={this.handleEdgeChange}/>)}
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