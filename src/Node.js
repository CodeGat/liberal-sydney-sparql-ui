import React from "react";
import { motion } from "framer-motion";
import "./Node.css";

const nodeType = {
  unknown:{
    backgroundColor: '#0000fe',
    borderRadius: '50%'
  },
  unknownopt:{
    backgroundColor: '#1e90ff',
    borderRadius: '50%',
    border: 'dashed 3px #0000fe'
  },
  selectedunknown:{
    backgroundColor: '#0000fe',
    borderRadius: '50%'
  },
  selectedunknownopt:{
    backgroundColor: '#1e90ff',
    borderRadius: '50%',
    border: 'dashed 3px #0000fe'
  },
  uri:{
    backgroundColor: '#4e4e4e',
    borderRadius: '50%'
  },
  uriopt:{
    backgroundColor: '#bebebe',
    borderRadius: '50%',
    border: '3px dashed #4e4e4e'
  },
  literal:{
    backgroundColor: '#4e4e4e',
    borderRadius: '50%'
  },
  literalopt:{
    backgroundColor: '#bebebe',
    borderRadius: '50%',
    border: '3px dashed #4e4e4e'
  },
  amalgam:{
    backgroundColor: '#444444',
    borderRadius: '10%'
  },
};

export default class Node extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleChangedText = this.handleChangedText.bind(this);
    this.state = {
      type: nodeType.unknown,
      isOptional: false,
      prefix: '',
      content: '?'
    }
  }

  handleClick(e){
    this.props.onSelectedItemChange(e)
  }

  handleChangedText(e){
    this.setState({content: e.target.textContent});
  }

  render(){
    const { type, isOptional, content } = this.state;
    const animation = type + isOptional ? "opt" : "";

    //todo: could use onfocusout event rather than onchange
    return (
      <motion.div className={"node"}
                  drag dragMomentum={false} onTap={this.handleClick}
                  variants={nodeType} initial={'unknown'} animate={animation} transition={{duration: 2}}
      >
          <input className={"transparentInput"}
                 value={content}
                 onChange={this.handleChangedText}/>
      </motion.div>
    );
  }

}