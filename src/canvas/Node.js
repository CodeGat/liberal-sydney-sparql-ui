import React from "react";
import { motion } from "framer-motion";
import "./Node.css";
import "./Canvas.css";

export default class Node extends React.Component {
  static variants = {
    nodeUnknown: isOpt => ({
      fill: '#0000fe',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#1e90ff'
    }),
    nodeSelectedUnknown: isOpt => ({
      fill: '#1e90ff',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#59adff'//'#0000fe'
    }),
    nodeUri: isOpt => ({
      fill: '#bebebe',
      rx: 50,
      ry: 50,
      height: 100,
      width: 100,
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#4e4e4e'
    }),
    nodeLiteral: isOpt => ({
      fill: '#4e4e4e',
      rx: 0,
      ry: 0,
      height: 100,
      width: 200,
      strokeWidth: isOpt ? 5 : 0,
      strokeDasharray: 3,
      stroke: '#bebebe'
    }),
    nodeAmalgam: isOpt => ({
      fill: '#444444',
      height: 100,
      width: 100,
      rx: 10,
      ry: 10,
      strokeWidth: isOpt ? 5 : 0,
      strokeDasharray: 3,
      stroke: '#bebebe'
    }),
    nodeUnf: isOpt => ({
      fill: '#0000fe',
      strokeWidth: isOpt ? 3: 0,
      strokeDasharray: 3,
      stroke: '#1e90ff',
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
    const { id, type, content, isOptional, amalgam } = this.props;
    e.preventDefault();

    this.props.onSelectedItemChange(type, id, content, isOptional, {amalgam: amalgam});

  }

  /**
   * Updates the state of the node with relation to it's text and type
   * @param e - event that triggered the function
   */
  handleChangedText = (e) => {
    const { id, type } = this.props;
    const changedText = e.target.value;
    let changedType;

    if (changedText.match(/".*".*|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)){
      changedType = 'nodeLiteral';
    } else if (type === 'nodeSelectedUnknown' || changedText.match(/\?.+/)) {
      changedType = 'nodeSelectedUnknown';
    } else if (changedText === '?') {
      changedType = 'nodeUnknown';
    } else {
      changedType = 'nodeUri';
    }

    this.props.onChangeNodeState(id, {content: changedText, type: changedType});
  }

  render(){
    const { type, isOptional, content, x, y, amalgam, isSelected } = this.props;

    const variant = Node.variants[type](isOptional);
    const currentNodeWidth = variant.width;
    const currentNodeHeight = variant.height;

    return (
      <motion.g whileHover={{scale: 1.2}} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
        <motion.rect x={x} y={y} onClickCapture={this.handleEntryExit}
                     variants={Node.variants} initial={false} animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        {type !== 'nodeUnf' &&
          <foreignObject x={x - (Node.labelWidth - currentNodeWidth) / 2}
                         y={y - (Node.labelHeight - currentNodeHeight) / 2}
                         width={Node.labelWidth} height={Node.labelHeight}
                         onClickCapture={this.handleEntryExit}
                         pointerEvents={"auto"} >
            <motion.input className={"nodeLabel"} value={content}
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