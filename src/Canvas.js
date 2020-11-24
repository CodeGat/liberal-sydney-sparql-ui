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

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event){
    this.props.onSelectedItemChange(event.target.textContent);
  }

  render() {
    const unknown = 'unknown';
    const animation = 'knownLit';

    return (
      <div className="canvas">
        <motion.div
          className="known" drag dragMomentum={false} onTap={this.handleClick}
          variants={nodeVariants}
          initial={unknown}
          animate={animation}
          transition={{duration: 4}}
        >
          <p style={{position: "center"}}>?</p>
        </motion.div>
      </div>
    );
  }
}