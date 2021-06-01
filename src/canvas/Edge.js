import React from 'react';
import {motion} from 'framer-motion';
import "./Canvas.css";
import "./Edge.css";

/**
 * Class that encapsulates all the different Edge types and their information, including Known and Unknown Edges.
 */
export default class Edge extends React.Component {
  // variants for visuals of the path line, based on whether the edge is known or a variable.
  static pathVariants = {
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

  // variants for the visuals of the input box on the path line, based on whether the edge is the selected item.
  static inputVariants = {
    selected: {
      border: 'solid 2px black'
    },
    unselected: {
      border: 'solid 0 black'
    }
  };

  // Constants for generic Edge sizes
  static labelHeight = 30;
  static labelWidth = 175;

  /**
   * Sets the clicked Edge to the currently selected Edge
   * @param e - the event that triggered the click
   */
  handleEntryExit = (e) => {
    const { id, type, isOptional } = this.props;

    this.props.onSelectedItemChange(type, id, e.target.value, isOptional, null);
  }

  /**
   * Send the updated input to the canvas state.
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
    const { subject, object, type, isOptional, content, tempEdge, complete, isSelected } = this.props;
    const objectIntersectX = complete ? object.intersectX : tempEdge.x; 
    const objectIntersectY = complete ? object.intersectY : tempEdge.y;
    
    const pathDef = `M${subject.intersectX} ${subject.intersectY} L${objectIntersectX} ${objectIntersectY}`;

    // basically, since any line has the bounds of a strange rectangle, we need to find the edges of the lines
    const smallX = subject.intersectX <= objectIntersectX ? subject.intersectX : objectIntersectX;
    const largeX = subject.intersectX >  objectIntersectX ? subject.intersectX : objectIntersectX;
    const smallY = subject.intersectY <= objectIntersectY ? subject.intersectY : objectIntersectY;
    const largeY = subject.intersectY >  objectIntersectY ? subject.intersectY : objectIntersectY;

    // determine the upper-left corner of the label (which will be in the centre of the above bounding rectangle)
    const labelX = (smallX + (largeX - smallX) / 2) - Edge.labelWidth / 2;
    const labelY = (smallY + (largeY - smallY) / 2) - Edge.labelHeight / 2;

    return (
      <g>
        <motion.path d={pathDef} markerEnd={"url(#arrow)"}
                     variants={Edge.pathVariants}
                     initial={'edgeUnknown'}
                     animate={type} custom={isOptional}
                     exit={{opacity: 0}} />
        <foreignObject x={labelX} y={labelY} width={Edge.labelWidth} height={Edge.labelHeight}>
          <motion.input className={"edgeLabel"} value={content}
                        initial={false} variants={Edge.inputVariants} animate={isSelected ? 'selected' : 'unselected'}
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