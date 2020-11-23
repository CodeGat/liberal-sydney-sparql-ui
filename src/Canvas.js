import React from "react";
import { motion } from 'framer-motion';
import "./Canvas.css"

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event){
    this.props.onSelectedItemChange(event.target.textContent);
  }

  render() {
    return (
      <div className="canvas">
        <motion.div className="known" drag dragMomentum={false} onTap={this.handleClick}>
          <p style={{position: "center"}}>?</p>
        </motion.div>
      </div>
    );
  }
}