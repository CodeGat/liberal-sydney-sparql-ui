import React from "react";
import { motion } from "framer-motion";
import "./Node";

export default class Node extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'untyped',
      prefix: '',
      label: ''
    }
  }

  componentWillUnmount() {

  }

  componentDidMount() {

  }

  render(){
    return (
      <motion.div className={}>
        <p>{}</p>
      </motion.div>
    );
  }

}