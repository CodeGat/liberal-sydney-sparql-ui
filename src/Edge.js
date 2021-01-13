import React from 'react';
import { motion } from 'framer-motion';
import "./Canvas.css";

export default class Edge extends React.Component {
  static variants = {
    unknown: isOpt => ({
      stroke: '#8e9094',
      strokeWidth: 3,
      strokeDasharray: isOpt ? 5 : 0
    }),
    known: isOpt => ({
      stroke: '#656669',
      strokeWidth: 3,
      strokeDasharray: isOpt ? 5 : 0
    }),
  };
  static labelHeight = 100;
  static labelWidth = 175;

  constructor(props) {
    super(props);
    this.state = {
      type: "unknown",
      isOptional: false,
      prefix: '',
      content: '?',

    };
  }

  handleEntryExit = (e) => {
    this.props.onSelectedItemChange(e.target.value);
  }

  handleChangedText = (e) => {
    const changedText = e.target.value;
    this.setState({content: changedText});

    if (changedText.match(/\?.*/)){
      this.setState({type: "unknown"});
    } else {
      this.setState({type: "known"});
    }
  }

  render() {
    const { from, to } = this.props;
    const { type, isOptional, content } = this.state;
    const def = `M${from.x} ${from.y} L${to.x} ${to.y}`;

    const smallX = from.x <= to.x ? from.x : to.x;
    const largeX = from.x >  to.x ? from.x : to.x;
    const smallY = from.y <= to.y ? from.y : to.y;
    const largeY = from.y >  to.y ? from.y : to.y;

    return (
      <g>
        <motion.path d={def} markerEnd={"url(#arrow)"}
                     variants={Edge.variants} initial='unknown' animate={type} custom={isOptional} />
        <foreignObject x={smallX + (largeX - smallX) / 2} y={smallY + (largeY - smallY) / 2}
                       width={Edge.labelWidth} height={Edge.labelHeight}>
          <motion.input value={content} onChange={this.handleChangedText} onBlur={this.handleEntryExit}
                        onClick={(e) => e.preventDefault()}/>
        </foreignObject>
      </g>
    );
  }
}