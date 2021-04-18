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
  static labelHeight = 55;
  static labelWidth = 150;

  /**
   *
   * @param e - event that triggered the function
   */
  handleEntryExit = (e) => {
    const { mode, edgeCompleting, id, type, content, x, y, midX, midY } = this.props;
    e.preventDefault();

    if (mode === "edge") {
      if (edgeCompleting){ // we finish the Edge at this Node
        const objectNodePos = {x: x, y: y, midX: midX, midY: midY};
        this.props.onEdgeCompletion(id, type, objectNodePos);
      } else { // we are starting a new Edge from this Node
        const subjectNodePos = {midX: midX, midY: midY};
        this.props.onEdgeCreation('?', id, subjectNodePos);
      }
    } else {
      this.props.onSelectedItemChange(type, id, content, null);
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
    const { mode, type, isOptional, content, x, y, amalgam } = this.props;

    const variant = Node.variants[type](isOptional);
    const currentNodeWidth = variant.width;
    const currentNodeHeight = variant.height;

    return (
      <motion.g whileHover={{scale: 1.2}} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
        <motion.rect x={x} y={y} onClickCapture={this.handleEntryExit} onMouseUpCapture={() => console.log("mouseup")}
                     variants={Node.variants} initial={false} animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        {type !== 'nodeUnf' &&
          <foreignObject x={x - (Node.labelWidth - currentNodeWidth) / 2} y={y - (Node.labelHeight - currentNodeHeight) / 2}
                         width={Node.labelWidth} height={Node.labelHeight}
                         pointerEvents={mode === "edge" ? "none" : "auto"} >
            <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                          onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                          onClick={(e) => e.preventDefault()}/>
            {amalgam && amalgam.type === 'UnknownClassAmalgam' &&
              <p className={'class-amalgam centered'}>{amalgam.inferredClass.label}</p>
            }
          </foreignObject>
        }
      </motion.g>
    );
  }
}