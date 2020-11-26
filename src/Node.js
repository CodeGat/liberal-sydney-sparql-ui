import React from "react";
import { motion } from "framer-motion";
import "./Node.css";

//todo: something wrong with animating to borderRadius
const nodeType = {
  unknown:{
    backgroundColor: '#0000fe',
    borderRadius: '50%',
    width: '100px'
  },
  unknownopt:{
    backgroundColor: '#1e90ff',
    borderRadius: '50%',
    border: 'dashed 3px #0000fe',
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
    border: 'dashed 3px #0000fe',
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
};

export default class Node extends React.Component {
  constructor(props) {
    super(props);
    this.handleEntryExit = this.handleEntryExit.bind(this);
    this.handleChangedText = this.handleChangedText.bind(this);
    this.state = {
      type: 'unknown',
      isOptional: false,
      prefix: '',
      content: '?'
    }
  }

  handleEntryExit(e){
    this.props.onSelectedItemChange(this.state.content);
  }

  handleChangedText(e){
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

    return (
      <motion.div className={"node"}
                  drag dragMomentum={false} onTap={this.handleEntryExit}
                  variants={nodeType} initial={'unknown'} animate={animation} transition={{duration: 1}}>
        <input className={"transparentInput"} value={content} onChange={this.handleChangedText} onBlur={this.handleEntryExit}/>
      </motion.div>
    );
  }
}