import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: something wrong with animating to borderRadius
const NODE_TYPE = {
  unknown:{
    backgroundColor: '#0000fe',
    borderRadius: '50%',
    width: '100px'
  },
  unknownopt:{
    backgroundColor: '#1e90ff',
    borderRadius: '50%',
    border: '3px dashed #0000fe',
    width: '100px'
  },
  selectedunknown:{
    backgroundColor: '#0000fe',
    borderRadius: '50%',
    width: '100px'
  },
  selectedunknownopt:{
    backgroundColor: '#1e90ff',
    borderRadius: '50%',
    border: '3px dashed #0000fe',
    width: '100px'
  },
  uri:{
    backgroundColor: '#4e4e4e',
    borderRadius: '50%',
    width: '100px'
  },
  uriopt:{
    backgroundColor: '#bebebe',
    borderRadius: '50%',
    border: '3px dashed #4e4e4e',
    width: '100px'
  },
  literal:{
    backgroundColor: '#4e4e4e',
    borderRadius: '0%',
    width: "200px"
  },
  literalopt:{
    backgroundColor: '#bebebe',
    borderRadius: '0%',
    border: '3px dashed #4e4e4e',
    width: '200px'
  },
  amalgam:{
    backgroundColor: '#444444',
    borderRadius: '10%'
  },
  unf: {
    width: '40px',
    height: '40px'
  }
};
const NODE_HEIGHT = 100;
const NODE_WIDTH = 100;

//todo: could remove mode in canvas in favour of drag=move, click=edge
export default class Node extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: props.initState,
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
    const animation = type + (isOptional ? "opt" : "");
    const { mode, init, x, y } = this.props;
    const adjustedX = x - NODE_WIDTH / 2;
    const adjustedY = y - NODE_HEIGHT / 2;

    return (
      <motion.div className={"node"}
                  drag dragMomentum={false} whileHover={{scale:1.2}} style={{x: adjustedX, y: adjustedY}}
                  variants={NODE_TYPE} initial={init} animate={animation} transition={{duration: 0.5}}
                  onClickCapture={this.handleEntryExit}>
        <input className={"canvas-input transparent"} value={content} disabled={mode === "edge"}
               onChange={this.handleChangedText} onBlur={this.handleEntryExit}/>
      </motion.div>
    );
  }
}