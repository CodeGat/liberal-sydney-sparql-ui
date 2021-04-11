import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

//todo: could remove mode in canvas in favour of drag=move, click=edge
export default class Node extends React.Component {
  static variants = {
    nodeUnknown: isOpt => ({
      fill: isOpt ? '#1e90ff' : '#0000fe',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeSelectedUnknown: isOpt => ({
      fill: isOpt ? '#1e90ff' : '#0000fe',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeUri: isOpt => ({
      fill: isOpt ? '#4e4e4e' : '#bebebe',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeLiteral: isOpt => ({
      fill: isOpt ? '#bebebe' : '#4e4e4e',
      rx: 0,
      ry: 0,
      height: 100,
      width: 200,
      strokeWidth: isOpt ? 5 : 0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeAmalgam: isOpt => ({
      fill: isOpt ? '#bebebe' : '#444444',
      height: 100,
      width: 100,
      rx: 10,
      ry: 10
    }),
    nodeUnf: isOpt => ({
      fill: isOpt ? '#1e90ff' : '#0000fe',
      strokeWidth: 0,
      strokeDasharray: 3,
      stroke: '#0000fe',
      width: 40,
      height: 40,
      rx: 70,
      ry: 70
    })
  };
  static nodeHeight = 100;
  static nodeWidth = 100;
  static unfWidth = 40;
  static unfHeight = 40;
  static literalWidth = 200;
  static labelHeight = 30;
  static labelWidth = 150;

  //todo: make defaultContent care about prefix! right now it just ignores it
  constructor(props) {
    super(props);
  }

  /**
   *
   * @param e - event that triggered the function
   */
  handleEntryExit = (e) => {
    const { mode, edgeCompleting, id, type, isOptional, content, x, y } = this.props;
    e.preventDefault();

    if (mode === "edge") {
      if (edgeCompleting){ // we finish the edge here
        const variant = Node.variants[type](isOptional);
        const info = {id: id, content: content};
        const shape = {
          x: x + variant.height / 2,
          y: y + variant.width / 2,
          width: variant.width,
          height: variant.height,
          rx: variant.rx, ry: variant.rx
        };
        const aux = {midX: x, midY: y};

        this.props.onEdgeCompletion(e, info, shape, aux);
      } else { // we are starting a new one
        const info = {id: id, content: content};
        const shape = {x: x, y: y};

        this.props.onEdgeCreation(info, shape, '?');
      }
    } else {
      this.props.onSelectedItemChange({type: type, id: id, content: content});
    }
  }

  /**
   * Updates the state of the node with relation to it's text and type
   * @param e - event that triggered the function
   */
  handleChangedText = (e) => {
    const { id } = this.props;
    const changedText = e.target.value;
    let changedType;

    if (changedText.match(/".*".*|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)){
      changedType = 'nodeLiteral';
    } else if (changedText.match(/\?.*/)) {
      changedType = 'nodeUnknown';
    } else {
      changedType = 'nodeUri';
    }

    this.props.onChangeNodeState(id, {content: changedText, type: changedType});
  }

  render(){
    const { mode, type, isOptional, content, x, y } = this.props;

    const variant = Node.variants[type](isOptional);
    const currentNodeWidth = variant.width;
    const currentNodeHeight = variant.height;
    const actualX = x - currentNodeWidth / 2;
    const actualY = y - currentNodeHeight / 2;

    return (
      <motion.g drag dragMomentum={false} whileHover={{scale: 1.2}}>
        <motion.rect x={actualX} y={actualY} onClickCapture={this.handleEntryExit} onMouseUpCapture={() => console.log("mouseup")}
                     variants={Node.variants} initial={false} animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        {type !== 'nodeUnf' &&
          <foreignObject x={actualX - (Node.labelWidth - currentNodeWidth) / 2} y={actualY + Node.labelHeight}
                         width={Node.labelWidth} height={Node.labelHeight}
                         pointerEvents={mode === "edge" ? "none" : "auto"} >
            <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                          onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                          onClick={(e) => e.preventDefault()}/>
          </foreignObject>
        }
      </motion.g>
    );
  }
}