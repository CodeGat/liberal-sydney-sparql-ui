import React from 'react';
import { motion } from 'framer-motion';
import "./Edge.css";
import "./Canvas.css";

const EDGE_TYPE = {
  unknown: {

  },
  unknownopt: {

  },
  known: {

  },
  knownopt: {

  }
};

export default class Edge extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      type: "unknown",
      isOptional: false,
      prefix: '',
      content: '?',

    };
  }

  handleEntryExit = (e) => {
    this.props.onSelectedItemChange(e.target.value);
  }

  handleChangedText = (e) => {
    this.setState({content: e.target.value});
  }

  render() {
    const { x: fromX, y: fromY } = this.props.from;
    const { x: toX, y: toY } = this.props.to;
    const { type, isOptional, content } = this.state;
    const animation = type + (isOptional ? "opt" : "");
    const pathDef = "M" + fromX + " " + fromY + " L" + toX + " " + toY;

    console.log("Using pathdef: " + pathDef);
    return (
      <div className="edge-container" style={{x: fromX, y: fromY}}>
        <motion.svg width="100%" height="100%">
          <motion.path className='edge' d={pathDef}
                       variants={EDGE_TYPE} initial={"unknown"} animate={animation} transition={{duration: 0.5}}
                       onTap={this.handleEntryExit}/>
        </motion.svg>
        <input className={"canvas-input opaque"} value={content}
               onChange={this.handleChangedText} onBlur={this.handleEntryExit}/>
      </div>
    );
  }
}