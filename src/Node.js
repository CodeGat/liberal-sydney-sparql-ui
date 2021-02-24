import React, {useState} from "react";
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
      filters: [],
      hovering: false
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

  toggleHovering = () => {
    this.setState(old => ({hovering: !old.hovering}));
  }

  render(){
    const { type, isOptional, content, adjustedX, adjustedY, hovering } = this.state;
    const { mode, init } = this.props;

    const currentNodeWidth = type.match(/node(Uri|Unknown)/) ? Node.nodeWidth : Node.literalWidth;

    return (
      <motion.g layout drag dragMomentum={false} whileHover={{scale: 1.2}}>
        <motion.rect layout x={adjustedX} y={adjustedY} onClickCapture={this.handleEntryExit}
                     onHoverStart={this.toggleHovering} onHoverEnd={this.toggleHovering}
                     variants={Node.variants} initial={init} animate={type} custom={isOptional}
                     transition={{duration: 0.5}} transformTemplate={() => "translateX(0) translateY(0)"}/>
        {type !== 'nodeUnf' &&
          <>
            <motion.foreignObject x={adjustedX - (Node.labelWidth - currentNodeWidth) / 2}
                                  y={adjustedY + Node.labelHeight}
                                  width={Node.labelWidth} height={Node.labelHeight}
                                  pointerEvents={mode === "edge" ? "none" : "auto"} >
              <motion.input className={"nodeLabel"} value={content} disabled={mode === "edge"}
                            onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                            onClick={(e) => e.preventDefault()}/>
            </motion.foreignObject>
            <FilterWrapper x={adjustedX} y={adjustedY} hovering={hovering} nodeWidth={currentNodeWidth} />
          </>
        }
      </motion.g>
    );
  }
}

class FilterWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'closed',
      filters: []
    }
  }

  toggleWrapperType = (type) => {
    console.log(type);
    this.setState({type: type});
  }

  render() {
    const { x, y, hovering, nodeWidth } = this.props;
    const { type } = this.state;

    if (type !== 'extended') {
      return (
        <FilterBubble x={x} y={y} hovering={hovering} nodeWidth={nodeWidth} variant={type}
                      onChangeWrapperToExtended={this.toggleWrapperType('extended')}
                      onChangeWrapperToSimple={this.toggleWrapperType('simple')}
                      onChangeWrapperToClosed={this.toggleWrapperType('closed')}/>
      );
    } else {
      return (
        <FilterPage onChangeWrapperToSimple={this.toggleWrapperType('simple')}/>
      );
    }
  }
}

function FilterBubble(props) {
  const bubbleVariants = {
    closed: {
      rx: 50,
      ry: 50,
      width: 40,
      height: 40
    },
    simple: {
      rx: 10,
      ry: 10,
      width: 150,
      height: 40,
      opacity: 1
    },
    vis: {
      opacity: 1
    },
    invis: {
      opacity: 0
    }
  };
  const filterVariants = {
    vis: {
      opacity: 1
    },
    invis: {
      opacity: 0
    }
  }
  const { x, y, hovering, nodeWidth, variant } = props;
  const visibility = hovering ? 'vis' : 'invis';

  return (
    <g>
      <motion.rect className={"filter-bubble"} x={(x + nodeWidth / 2 + 10) / 2} y={(y + 60) / 2}
                   variants={bubbleVariants}
                   initial={['invis', 'closed']} animate={[visibility, variant]}
                   onHoverStart={props.onChangeWrapperToSimple} onHoverEnd={props.onChangeWrapperToClosed}
                   onClickCapture={props.onChangeWrapperToExtended} />
      <svg x={x + nodeWidth / 2 + 10} y={y + 60} width={40} height={40} >
        <motion.path className={"filter-icon"} d={"M18 26 L18 18 L10 10 L30 10 L22 18 L22 30 L18 26 Z"}
                     variants={filterVariants} initial={'invis'} animate={visibility} />
      </svg>
    </g>
  );
}

class FilterPage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return null;
  }
}