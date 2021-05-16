import nodeImg from "./img/node_icon_known.png";
import arrowKnownImg from "./img/arrow_icon_known_black.png";
import arrowUnknownImg from "./img/arrow_icon_unknown_black.png";
import litImg from "./img/literal_icon_known.png";
import unkImg from "./img/node_icon_unknown.png";
import noneImg from "./img/none_icon.png";
import React, {useState} from "react";
import {motion} from "framer-motion";
import "./ItemViewerComponents.css";

export function ItemImageHeader(props) {
  const { type, name, isDragged } = props;
  let src = noneImg, alt = 'unknown type';

  if (type === 'nodeUri') {
    src = nodeImg;
    alt = 'selected known node';
  } else if (type === 'edgeKnown') {
    src = arrowKnownImg;
    alt = 'selected known edge';
  } else if (type === 'edgeUnknown') {
    src = arrowUnknownImg;
    alt = 'selected unknown edge';
  } else if (type === 'nodeLiteral') {
    src = litImg;
    alt = 'selected known literal';
  } else if (type === 'nodeUnknown' || type === 'nodeSelectedUnknown') {
    src = unkImg;
    alt = 'selected unknown node';
  } else if (type === 'edgeUnknown') {
    src = arrowUnknownImg;
    alt = 'selected unknown edge';
  }

  return (
    <>
      <motion.img layout src={src} alt={alt}
                  animate={{opacity: isDragged ? 0 : 1}} transition={{opacity: {duration: 0.1}}} />
      <p>{type === '' ? "Nothing currently selected" : name}</p>
    </>
  );
}

export function ItemPrefix(props) {
  const { prefix } = props;

  return (
    <>
      <p>From</p>
      <p className={'light small'}>{prefix}</p>
    </>
  );
}

export function ItemDesc(props) {
  const { desc } = props;

  return (
    <>
      <p>Desc.</p>
      <p className={'light small'}>{desc}</p>
    </>
  );
}

export function ItemInferredProps(props) {
  const { meta } = props;

  if (meta && meta.amalgam && meta.amalgam.type === 'UnknownClassAmalgam'){
    return (
      <>
        <p>Type</p>
        <p className={'light small'}>{meta.amalgam.inferredClass.label}</p>
      </>
    );
  } else return null;
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

const buttonVariants = {
  Yes: {backgroundColor: '#b3b3b3'},
  No: {backgroundColor: '#9c9c9c'}
};

export function BoundUnknownCheckbox(props) {
  const { type } = props;
  const toggleBound = () => props.onBoundChange(type === 'nodeUnknown' ? 'nodeSelectedUnknown' : 'nodeUnknown');
  const isSelected = type === 'nodeSelectedUnknown' ? 'yes' : 'no';

  return (
    <>
      <p>Show in results?</p>
      <motion.div className={'button'} variants={buttonVariants} initial={false} animate={isSelected}
                  onClick={() => toggleBound()}>
        <p>{isSelected}</p>
      </motion.div>
    </>
  );
}

export function DeleteItemButton(props) {
  const { id } = props;
  const deleteItem = (id) => props.deleteItemCascade(id);

  return (
    <>
      <p>Delete Node</p>
      <div className='button' onClick={() => deleteItem(id)}>
        <p>Delete</p>
      </div>
    </>
  );
}

export function OptionalTripleButton(props) {
  const [isOptional, setIsOptional] = useState(false);
  const toggleOptional = () => setIsOptional(!isOptional);
  const optionality = isOptional ? 'Yes' : 'No';

  return (
    <>
      <p>Make Optional</p>
      <motion.div className='button' variants={buttonVariants} initial={false} animate={optionality}
                  onClick={() => toggleOptional()}>
        <p>{optionality}</p>
      </motion.div>
    </>
  );
}