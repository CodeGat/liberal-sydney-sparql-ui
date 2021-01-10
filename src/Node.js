import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: something wrong with animating to borderRadius
const NODE_TYPE = {
  unknown:{
    fill: '#0000fe',
    rx: 50,
    height: "100px",
    width: '100px'
  },
  unknownopt:{
    fill: '#1e90ff',
    rx: 50,
    border: '3px dashed #0000fe',
    height: "100px",
    width: '100px'
  },
  selectedunknown:{
    fill: '#0000fe',
    rx: 50,
    height: "100px",
    width: '100px'
  },
  selectedunknownopt:{
    fill: '#1e90ff',
    rx: 50,
    border: '3px dashed #0000fe',
    height: "100px",
    width: '100px'
  },
  uri:{
    fill: '#4e4e4e',
    rx: 50,
    height: "100px",
    width: '100px'
  },
  uriopt:{
    fill: '#bebebe',
    rx: 50,
    border: '3px dashed #4e4e4e',
    height: "100px",
    width: '100px'
  },
  literal:{
    fill: '#4e4e4e',
    rx: 0,
    height: "100px",
    width: "200px"
  },
  literalopt:{
    fill: '#bebebe',
    rx: 0,
    border: '3px dashed #4e4e4e',
    height: "100px",
    width: '200px'
  },
  amalgam:{
    fill: '#444444',
    height: "100px",
    width: "100px",
    rx: 10
  },
  unf: {
    width: '40px',
    height: '40px'
  }
};

const NODE_HEIGHT = 100, NODE_WIDTH = 100, LITERAL_WIDTH = 200;
const LABEL_HEIGHT = 100, LABEL_WIDTH = 150;
//todo: could remove mode in canvas in favour of drag=move, click=edge
export default class Node extends React.Component {
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
    e.preventDefault();

    if (mode.includes("edge")) {
      const {x, y} = this.props;
      const node = {id: this.props.id, content: this.state.content, x: x, y: y}

      this.props.onEdgeAction(node);
    } else {
      const { id } = this.props;
      const { content } = this.state;

      this.props.onSelectedItemChange({id: id, content: content});
    }
  }

  handleChangedText = (e) => {
    const changedText = e.target.value;
    this.setState({content: e.target.value});

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
    const rectAnimation = type + (isOptional ? "opt" : "");
    const { mode, init, x, y } = this.props;
    const adjustedX = x - NODE_WIDTH / 2;
    const adjustedY = y - NODE_HEIGHT / 2;
    const currentNodeWidth = type.match(/uri|unknown/) ? NODE_WIDTH : LITERAL_WIDTH;

    return (
      <motion.g drag dragMomentum={false} whileHover={{scale: 1.2}}>
        <motion.rect x={adjustedX} y={adjustedY} onClickCapture={this.handleEntryExit}
                     variants={NODE_TYPE} initial="unknown" animate={rectAnimation} transition={{duration: 0.5}}
                     transformTemplate={() => "translateX(0) translateY(0)"}/>
        <foreignObject x={adjustedX - (LABEL_WIDTH - currentNodeWidth) / 2} y={adjustedY}
                              width={LABEL_WIDTH} height={LABEL_HEIGHT}>
          <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                 onChange={this.handleChangedText} onBlur={this.handleEntryExit} onClick={(e) => e.preventDefault()}/>
        </foreignObject>
      </motion.g>
    );
  }
}