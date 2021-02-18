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
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeSelectedUnknown: isOpt => ({
      fill: isOpt ? '1e90ff' : '#0000fe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeUri: isOpt => ({
      fill: isOpt ? '#4e4e4e' : '#bebebe',
      rx: 50,
      height: "100px",
      width: '100px',
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeLiteral: isOpt => ({
      fill: isOpt ? '#bebebe' : '#4e4e4e',
      rx: 0,
      height: "100px",
      width: "200px",
      strokeWidth: isOpt ? 5 :  0,
      strokeDasharray: 3,
      stroke: '#0000fe'
    }),
    nodeAmalgam: {
      fill: '#444444',
      height: "100px",
      width: "100px",
      rx: 10
    },
    nodeUnf: {
      fill: '#0000fe',
      width: '40px',
      height: '40px',
      rx: 70
    },
  };
  static nodeHeight = 100;
  static nodeWidth = 100;
  static unfWidth = 40;
  static unfHeight = 40;
  static literalWidth = 200;
  static labelHeight = 30;
  static labelWidth = 150;

  constructor(props) {
    super(props);
    this.state = {
      type: props.init,
      isOptional: false,
      prefix: '',
      content: '?',
      adjustedX: props.x - (props.init === "nodeUnf" ? Node.unfWidth : Node.nodeWidth) / 2,
      adjustedY: props.y - (props.init === "nodeUnf" ? Node.unfHeight : Node.nodeHeight) / 2,
      filters: []
    };
  }

  handleEntryExit = (e) => {
    const { mode, edgeCompleting, id } = this.props;
    const { content, type } = this.state;
    e.preventDefault();

    if (mode === "edge") {
      const { x, y } = this.props;
      const { isOptional, adjustedX, adjustedY } = this.state;

      if (edgeCompleting){ // we finish the edge here
        const variant = Node.variants[type](isOptional);
        const info = {id: id, content: content};
        const shape = {
          x: adjustedX, y: adjustedY,
          width: parseInt(variant.width),
          height: parseInt(variant.height),
          rx: variant.rx, ry: variant.rx
        };
        const aux = {midX: x, midY: y};

        this.props.onEdgeCompletion(e, info, shape, aux);
      } else { // we are starting a new one
        const info = {id: id, content: content};
        const shape = {x: x, y: y};

        this.props.onEdgeCreation(e, info, shape);
      }
    } else {
      this.props.onSelectedItemChange({type: type, id: id, content: content});
    }
  }

  handleChangedText = (e) => {
    const changedText = e.target.value;
    this.setState({content: changedText});

    if (changedText.match(/".*".*|true|false|[+-]?\d+|[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)){
      this.setState({type: 'nodeLiteral'});
    } else if (changedText.match(/.*:.*/)){
      this.setState({type: 'nodeUri'});
    } else if (changedText.match(/\?.*/)) {
      this.setState({type: 'nodeUnknown'});
    }
  }

  render(){
    const { type, isOptional, content, adjustedX, adjustedY } = this.state;
    const { mode, init } = this.props;

    const currentNodeWidth = type.match(/node(Uri|Unknown)/) ? Node.nodeWidth : Node.literalWidth;

    return (
      <motion.g layout drag dragMomentum={false} whileHover={{scale: 1.2}} >
        <FilterBubble x={adjustedX} y={adjustedY} />
        <motion.rect x={adjustedX} y={adjustedY} onClickCapture={this.handleEntryExit}
                     variants={Node.variants} initial={init} animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        {type !== 'nodeUnf' &&
          <foreignObject x={adjustedX - (Node.labelWidth - currentNodeWidth) / 2} y={adjustedY + Node.labelHeight}
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

class FilterBubble extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      variant: 'vis'
    };
  }

  static bubbleVariants = {
    invis: {
      opacity: 0,
      rx: 50,
      ry: 50,
      width: 40,
      height: 40
    },
    vis: {
      opacity: 1,
      rx: 50,
      ry: 50,
      width: 40,
      height: 40
    },
    open: {
      opacity: 1
    }
  };
  static filterVariants = {
    invis: {
      opacity: 0,
      pathLength: 0
    },
    vis: {
      opacity: 1,
      pathLength: 1
    },
    open: {

    }
  };

  render() {
    const { x, y } = this.props;
    const { variant } = this.state;

    return (
      <g>
        <motion.rect className={"filter-bubble"} x={x} y={y}
                     variants={FilterBubble.bubbleVariants} initial={"invis"} animate={variant} />
        <svg width={40} height={40} >
          <motion.path className={"filter-icon"} d={"M18 26 L18 18 L10 10 L30 10 L22 18 L22 30 L18 26 Z"}
                       stroke={'#000000'}
                       variants={FilterBubble.filterVariants} initial={'invis'} animate={variant} />
        </svg>
      </g>
    );
  }
}