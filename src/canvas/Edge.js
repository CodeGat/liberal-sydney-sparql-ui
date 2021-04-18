import React from 'react';
import {motion} from 'framer-motion';
import "./Canvas.css";
import "./Edge.css";

export default class Edge extends React.Component {
  static variants = {
    edgeUnknown: isOpt => ({
      stroke: '#8e9094',
      strokeWidth: 3,
      strokeDasharray: isOpt ? 5 : 0,
      opacity: 1
    }),
    edgeKnown: isOpt => ({
      stroke: '#656669',
      strokeWidth: 3,
      strokeDasharray: isOpt ? 5 : 0,
      opacity: 1
    })
  };
  static labelHeight = 30;
  static labelWidth = 175;

  handleEntryExit = (e) => {
    const { id, type } = this.props;

    this.props.onSelectedItemChange({type: type, id: id, content: e.target.value});
  }

  /**
   * Send the updated input to the Canvas
   * @param e - the event that triggered the function
   */
  handleChangedText = (e) => {
    const { id } = this.props;
    const changedText = e.target.value;
    let changedType;

    if (changedText.match(/\?.*/)){
      changedType = 'edgeUnknown';
    } else {
      changedType = 'edgeKnown';
    }

    this.props.onChangeEdgeState(id, {type: changedType, content: changedText});
  }

  render() {
    const { subject, object, type, isOptional, content } = this.props;
    const pathDef = `M${subject.intersectX} ${subject.intersectY} L${object.intersectX} ${object.intersectY}`;

    const smallX = subject.intersectX <= object.intersectX ? subject.intersectX : object.intersectX;
    const largeX = subject.intersectX >  object.intersectX ? subject.intersectX : object.intersectX;
    const smallY = subject.intersectY <= object.intersectY ? subject.intersectY : object.intersectY;
    const largeY = subject.intersectY >  object.intersectY ? subject.intersectY : object.intersectY;

    const labelX = (smallX + (largeX - smallX) / 2) - Edge.labelWidth / 2;
    const labelY = (smallY + (largeY - smallY) / 2) - Edge.labelHeight / 2;

    return (
      <g>
        <motion.path d={pathDef} markerEnd={"url(#arrow)"}
                     variants={Edge.variants}
                     initial={'edgeUnknown'}
                     animate={type} custom={isOptional}
                     exit={{opacity: 0}} />
        <foreignObject x={labelX} y={labelY} width={Edge.labelWidth} height={Edge.labelHeight}>
          <input className={"edgeLabel"} value={content}
                        onChange={this.handleChangedText}
                        onBlur={this.handleEntryExit}
                        onClick={(e) => {
                          e.preventDefault();
                          this.handleEntryExit(e);
                        }}/>
        </foreignObject>
      </g>
    );
  }
}