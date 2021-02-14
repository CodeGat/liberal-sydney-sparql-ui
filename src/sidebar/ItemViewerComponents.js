import nodeImg from "./node_icon_known.png";
import arrowKnownImg from "./arrow_icon_known_black.png";
import arrowUnknownImg from "./arrow_icon_unknown_black.png";
import litImg from "./literal_icon_known.png";
import unkImg from "./node_icon_unknown.png";
import noneImg from "./none_icon.png";
import React from "react";
import {motion} from "framer-motion";

export function ItemImageHeader(props) {
  const { type, name } = props;

  let Image;
  if (type === 'nodeUri') Image = <motion.img layout src={nodeImg} alt={'selected known node icon'}/>
  else if (type === 'edgeKnown') Image = <motion.img layout src={arrowKnownImg} alt={'selected known edge icon'}/>
  else if (type === 'edgeUnknown') Image = <motion.img layout src={arrowUnknownImg} alt={'selected unknown edge icon'}/>
  else if (type === 'nodeLiteral') Image = <motion.img layout src={litImg} alt={'selected known literal icon'}/>
  else if (type === 'nodeUnknown') Image = <motion.img layout src={unkImg} alt={'selected unknown node icon'}/>
  else if (type === 'edgeUnknown') Image = <motion.img layout src={arrowUnknownImg} alt={'selected unknown edge icon'}/>
  else Image = <motion.img layout src={noneImg} alt={'unknown type icon'} />

  return (
    <>
      {Image}
      <motion.p layout>{type === '' ? "Nothing currently selected" : name}</motion.p>
    </>
  );
}

export function ItemPrefix(props) {
  const { prefix } = props;

  return (
    <>
      <motion.p layout>From</motion.p>
      <motion.p layout className={'light small'}>{prefix}</motion.p>
    </>
  );
}

export function ItemDesc(props) {
  const { desc } = props;

  return (
    <>
      <motion.p layout>Desc.</motion.p>
      <motion.p layout className={'light small'}>{desc}</motion.p>
    </>
  );
}

//todo: infer properties based on connections to a ? node
export function ItemInferredProps(props) {
  console.log(props);
  return null;
}

export function ItemLiteralType(props) {
  const { content } = props;
  let type;

  if (content.match(/".*".*/)) {
    type = "text";
  } else if (content.match(/true|false/)) {
    type = "boolean";
  } else if (content.match(/[+-]?\d+/)) {
    type = "integer";
  } else if (content.match(/[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)) {
    type = "floating point";
  }

  return (
    <>
      <motion.p layout>Type</motion.p>
      <motion.p layout>{type}</motion.p>
    </>
  );
}
