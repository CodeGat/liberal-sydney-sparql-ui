import React from "react";
import { motion } from 'framer-motion';
import "./Canvas.css"
import Node from "./Node"

//todo: where to store the underlying SPARQL representation?
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.handleNodeChange = this.handleNodeChange.bind(this);
  }

  // handleClick(event){
  //   this.props.onSelectedItemChange(event.target.textContent);
  // }

  handleNodeChange(content){
    this.props.onSelectedItemChange(content);
  }

  render() {
    const items = [{}];

    return (
      <div className="canvas">
        <Node onSelectedItemChange={this.handleNodeChange}/>
        <Node onSelectedItemChange={this.handleNodeChange}/>
      </div>
    );
  }
}