import React from "react";
import { motion } from 'framer-motion';
import "./Canvas.css"

export default class Canvas extends React.Component {


  render() {
    return (
      <div className="canvas">
        <motion.div className="known" drag layout dragMomentum={false}>
          <p style={{position: "center"}}>?</p>
        </motion.div>
      </div>
    );
  }
}