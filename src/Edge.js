import React from 'react';
import { motion } from 'framer-motion';
import "./Edge.css";
import "./Canvas.css";

export default class Edge extends React.Component{
  constructor(props) {
    super(props);
    this.state = {content: ''};
  }

  handleEntryExit = (e) => {
    this.props.onSelectedItemChange(e.target.value);
  }

  handleChangedText = (e) => {
    this.setState({content: e.target.value});
  }

  render() {
    const {x: fromX, y: fromY} = this.props.from;
    const {x: toX, y: toY} = this.props.to;

    const pathDef = "M" + fromX + " " + fromY + " L" + toX + " " + toY;

    return (
      <motion.svg>
        <motion.path className='edge'
                     d={pathDef} onTap={this.handleEntryExit}>
          <input className={"canvas-input opaque"} value={"Testing"}
                 onChange={this.handleEntryExit} onBlur={this.handleChangedText}/>
        </motion.path>
      </motion.svg>
    );
  }
}