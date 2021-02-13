import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: could remove mode in canvas in favour of drag=move, click=edge
export default class Node extends React.Component {
  static variants = {
    nodeUnknown: isOpt => ({
      fill: isOpt ? '#1e90ff' : '#0000fe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeSelectedUnknown: isOpt => ({
      fill: isOpt ? '1e90ff' : '#0000fe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeUri: isOpt => ({
      fill: isOpt ? '#4e4e4e' : '#bebebe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeLiteral: isOpt => ({
      fill: isOpt ? '#bebebe' : '#4e4e4e',
      rx: 0,
      height: "100px",
      width: "200px",
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeAmalgam: {
      fill: '#444444',
      height: "100px",
      width: "100px",
      rx: 10
    },
    nodeUnf: {
      width: '40px',
      height: '40px'
    },
  };
  static nodeHeight = 100;
  static nodeWidth = 100;
  static literalWidth = 200;
  static labelHeight = 30;
  static labelWidth = 150;

  constructor(props) {
    super(props);
    this.state = {
      type: props.init,
      isOptional: false,
      prefix: '',
      content: '?',
      adjustedX: props.x - Node.nodeWidth / 2,
      adjustedY: props.y - Node.nodeHeight / 2
    };
  }

  handleEntryExit = (e) => {
    const { mode, edgeCompleting, id } = this.props;
    const { content, type } = this.state;
    e.preventDefault();

    if (mode === "edge") {
      const { x, y } = this.props;
      const { isOptional, adjustedX, adjustedY } = this.state;

      if (edgeCompleting){ // we finish the edge here
        const variant = Node.variants[type](isOptional);
        const info = {id: id, content: content};
        const shape = {
          x: adjustedX, y: adjustedY,
          width: parseInt(variant.width),
          height: parseInt(variant.height),
          rx: variant.rx, ry: variant.rx
        };
        const aux = {midX: x, midY: y};

        this.props.onEdgeCompletion(e, info, shape, aux);
      } else { // we are starting a new one
        const info = {id: id, content: content};
        const shape = {x: x, y: y};

        this.props.onEdgeCreation(e, info, shape);
      }
    } else {
      this.props.onSelectedItemChange({type: type, id: id, content: content});
    }
  }

  handleChangedText = (e) => {
    const changedText = e.target.value;
    this.setState({content: changedText});

    if (changedText.match(/".*".*|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)){
      this.setState({type: 'nodeLiteral'});
    } else if (changedText.match(/.*:.*/)){
      this.setState({type: 'nodeUri'});
    } else if (changedText.match(/\?.*/)) {
      this.setState({type: 'nodeUnknown'});
    }
  }

  render(){
    const { type, isOptional, content, adjustedX, adjustedY } = this.state;
    // const { mode, init } = this.props;
    const { mode } = this.props;
    const currentNodeWidth = type.match(/node(Uri|Unknown)/) ? Node.nodeWidth : Node.literalWidth;

    return (
      <motion.g drag dragMomentum={false} whileHover={{scale: 1.2}}>
        <motion.rect x={adjustedX} y={adjustedY} onClickCapture={this.handleEntryExit}
                     variants={Node.variants} initial="nodeUnknown" animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        <foreignObject x={adjustedX - (Node.labelWidth - currentNodeWidth) / 2} y={adjustedY + Node.labelHeight}
                       width={Node.labelWidth} height={Node.labelHeight}
                       pointerEvents={mode === "edge" ? "none" : "auto"} >
          <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                        onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                        onClick={(e) => e.preventDefault()}/>
        </foreignObject>
      </motion.g>
    );
  }
}