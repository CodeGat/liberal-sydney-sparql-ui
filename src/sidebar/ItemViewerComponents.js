import nodeImg from "./node_icon_known.png";
import arrowKnownImg from "./arrow_icon_known_black.png";
import arrowUnknownImg from "./arrow_icon_unknown_black.png";
import litImg from "./literal_icon_known.png";
import unkImg from "./node_icon_unknown.png";
import noneImg from "./none_icon.png";
import React from "react";

export function ItemImageHeader(props) {
  const { type, name } = props;

  if (type === 'nodeUri') {
    return (
      <>
        <img className={'grid-img'} src={nodeImg} alt={'selected known node icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'edgeKnown') {
    return (
      <>
        <img className={'grid-img'} src={arrowKnownImg} alt={'selected known edge icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'edgeUnknown') {
    return (
      <>
        <img className={'grid-img'} src={arrowUnknownImg} alt={'selected unknown edge icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'nodeLiteral') {
    return (
      <>
        <img className={'grid-img'} src={litImg} alt={'selected known literal icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'nodeUnknown') {
    return (
      <>
        <img className={'grid-img'} src={unkImg} alt={'selected unknown node icon'} />
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else {
    return (
      <>
        <img className={"grid-img"} src={noneImg} alt={'unknown type icon'} />
        <p className={'grid-name'}>{type === '' ? 'Nothing is currently selected' : 'Unknown selected item'}</p>
      </>
    );
  }
}

export function ItemPrefix(props) {
  const { prefix } = props;

  return (
    <>
      <p className={'grid-from'}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
    </>
  );
}

export function ItemDesc(props) {
  const { desc } = props;

  return (
    <>
      <p className={'grid-desc'}>Desc.</p>
      <p className={'grid-description light small'}>{desc}</p>
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
      <p>Type</p>
      <p>{type}</p>
    </>
  );
}
