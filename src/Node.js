import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: could remove mode in canvas in favour of drag=move, click=edge
//todo: keep track of circle intersection?
export default class Node extends React.Component {
  static variants = {
    unknown: isOpt => ({
      fill: isOpt ? '#1e90ff' : '#0000fe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    selectedunknown: isOpt => ({
      fill: isOpt ? '1e90ff' : '#0000fe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    uri: isOpt => ({
      fill: isOpt ? '#4e4e4e' : '#bebebe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    literal: isOpt => ({
      fill: isOpt ? '#bebebe' : '#4e4e4e',
      rx: 0,
      height: "100px",
      width: "200px",
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    amalgam: {
      fill: '#444444',
      height: "100px",
      width: "100px",
      rx: 10
    },
    unf: {
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
      content: '?'
    };
  }

  handleEntryExit = (e) => {
    const { mode } = this.props;
    const { content } = this.state;
    e.preventDefault();

    if (mode === "edge") {
      const { x, y, id } = this.props;
      const node = {id: id, content: content, x: x, y: y}

      this.props.onEdgeAction(node, e);
    } else {
      const { id } = this.props;

      this.props.onSelectedItemChange({id: id, content: content});
    }
  }

  handleChangedText = (e) => {
    const changedText = e.target.value;
    this.setState({content: changedText});

    if (changedText.match(/".*".*|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)){
      this.setState({type: 'literal'});
    } else if (changedText.match(/.*:.*/)){
      this.setState({type: 'uri'});
    } else if (changedText.match(/\?.*/)) {
      this.setState({type: 'unknown'});
    }
  }

  render(){
    const { type, isOptional, content } = this.state;
    const { mode, init, x, y } = this.props;
    const adjustedX = x - Node.nodeWidth / 2;
    const adjustedY = y - Node.nodeHeight / 2;
    const currentNodeWidth = type.match(/uri|unknown/) ? Node.nodeWidth : Node.literalWidth;

    return (
      <motion.g drag dragMomentum={false} whileHover={{scale: 1.2}}>
        <motion.rect x={adjustedX} y={adjustedY} onClickCapture={this.handleEntryExit}
                     variants={Node.variants} initial="unknown" animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        <foreignObject x={adjustedX - (Node.labelWidth - currentNodeWidth) / 2} y={adjustedY + Node.labelHeight}
                       width={Node.labelWidth} height={Node.labelHeight}>
          <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                        onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                        onClick={(e) => e.preventDefault()}/>
        </foreignObject>
      </motion.g>
    );
  }
}