import React from "react";
import { motion } from "framer-motion";
import "./Node.css";

export default class Node extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'untyped',
      prefix: '',
      label: ''
    }
  }

  render(){
    const type = this.state.type;
    const prefix = this.state.prefix;
    const label = this.state.label;

    return (
      <motion.div className={"node"}>
          <p>{prefix + ':' + label}</p>
      </motion.div>
    );
  }

}