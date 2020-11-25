import React from "react";
import { motion } from 'framer-motion';
import "./Canvas.css"

const nodeVariants = {
  unknown: {
    backgroundColor: '#00008b',
    borderRadius: '50%'
  },
  knownLit: {
    backgroundColor: '#bebebe',
    borderRadius: '0%'
  },
  knownUri: {
    backgroundColor: '#bebebe',
    borderRadius: '50%'
  }
};

const literalRegex = /".*"(\^\^.*|@.*)?|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\.\d+[eE][+-]?\d+|\d+[eE][+-]?\d+)/;

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.state ={content: '?'}
  }

  handleClick(event){
    this.props.onSelectedItemChange(event.target.textContent);
  }

  handleTextChange(event){
    this.setState({content: event.target.value});
  }

  render() {
    const animation = 'knownLit';
    const content = this.state.content;

    return (
      <div className="canvas">
        <motion.div
          className="known" drag dragMomentum={false} onTap={this.handleClick}
          variants={nodeVariants}
          initial={'unknown'}
          animate={animation}
          transition={{duration: 4}}
        >
          <input style={{textAlign: 'center', background: "transparent", border: "none"}} value={content} onChange={this.handleTextChange}/>
        </motion.div>
      </div>
    );
  }
} //textalign doesn't work!