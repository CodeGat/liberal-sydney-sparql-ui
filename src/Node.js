import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: something wrong with animating to borderRadius
const NODE_TYPE = {
  unknown:{
    fill: '#0000fe',
    rx: '50%',
    width: '100px'
  },
  unknownopt:{
    fill: '#1e90ff',
    rx: '50%',
    border: '3px dashed #0000fe',
    width: '100px'
  },
  selectedunknown:{
    fill: '#0000fe',
    rx: '50%',
    width: '100px'
  },
  selectedunknownopt:{
    fill: '#1e90ff',
    rx: '50%',
    border: '3px dashed #0000fe',
    width: '100px'
  },
  uri:{
    fill: '#4e4e4e',
    rx: '50%',
    width: '100px'
  },
  uriopt:{
    fill: '#bebebe',
    rx: '50%',
    border: '3px dashed #4e4e4e',
    width: '100px'
  },
  literal:{
    fill: '#4e4e4e',
    rx: '0%',
    width: "200px"
  },
  literalopt:{
    fill: '#bebebe',
    rx: '0%',
    border: '3px dashed #4e4e4e',
    width: '200px'
  },
  amalgam:{
    fill: '#444444',
    rx: '10%'
  },
  unf: {
    width: '40px',
    height: '40px'
  }
};
const EDITABLE_LABEL = {
  editable: {
    fill: '#000000'
  },
  noteditable: {
    fill: '#EBEBE4'
  }
};
const NODE_HEIGHT = 100;
const NODE_WIDTH = 100;
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
    e.stopPropagation();
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();

    if (this.props.mode.includes("edge")) {
      const {x, y} = this.props;
      const node = {id: this.props.id, content: this.state.content, x: x, y: y}

      this.props.onEdgeAction(node);
    } else {
      this.props.onSelectedItemChange({id: this.props.id, content: this.state.content});
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

    console.log("type: " + type + ", init: " + init + " the animation should be :" + rectAnimation);

    //todo: inline svg styles
    return (
      <g>
        <motion.rect className={"node"}
                     drag dragMomentum={false} whileHover={{scale: 1.2}} x={adjustedX} y={adjustedY}
                     variants={NODE_TYPE} initial={init} animate={rectAnimation} transition={{duration: 0.5}}
                     onClickCapture={this.handleEntryExit}/>
        <motion.text className={"canvas-input opaque"} fill="#222222"
                     variants={EDITABLE_LABEL} animate={mode === "edge" ? "noteditable" : "editable"}
                     onChange={this.handleChangedText} onBlur={this.handleEntryExit}>
          {content}
        </motion.text>
      </g>
    );
  }
}