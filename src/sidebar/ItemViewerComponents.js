import nodeImg from "./img/node_icon_known.png";
import arrowKnownImg from "./img/arrow_icon_known_black.png";
import arrowUnknownImg from "./img/arrow_icon_unknown_black.png";
import litImg from "./img/literal_icon_known.png";
import unkImg from "./img/node_icon_unknown.png";
import noneImg from "./img/none_icon.png";
import React from "react";
import {motion} from "framer-motion";
import "./ItemViewerComponents.css";

/**
 * Fragment of the SelectedItemViewer and Suggestion - returns the associated icon and the name of the currently
 *   selected item.
 * @param {string} type - type of the currently selected item
 * @param {string} name - name of the currently selected item
 * @param {boolean} isDragged - is the Suggestion being dragged onto the canvas, in which case remove its icon
 * @returns {JSX.Element} - the fragment of icon and name
 */
export function ItemImageHeader({ type, name, isDragged }) {
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

/**
 * Fragment of the Suggestion/SelectedItemViewer responsible for showing the Prefix
 * @param {string} prefix - the prefix to show
 * @returns {JSX.Element} - the HTML fragment to display
 */
export function ItemPrefix({prefix}) {
  return (
    <>
      <p>From</p>
      <p className={'light small'}>{prefix}</p>
    </>
  );
}

/**
 * Fragment of Suggestion/SelectedItemViewer responsible for displaying the rdfs:comment, if it exists
 * @param {string} desc - the rdfs:comment of the associated suggestion/selected item
 * @returns {JSX.Element} - the HTML fragment of a description
 */
export function ItemDesc({desc}) {
  return (
    <>
      <p>Desc.</p>
      <p className={'light small'}>{desc}</p>
    </>
  );
}


/**
 * A fragment of a SelectedItemViewer for determining the type of Selected/Unknowns
 * @param {Object} meta - object for all inferred information about a Unknown node
 * @returns {JSX.Element|null} - the HTML fragment, if there is meta-information to display
 */
export function ItemInferredProps({meta}) {
  if (meta && meta.amalgam && meta.amalgam.type === 'UnknownClassAmalgam'){
    return (
      <>
        <p>Type</p>
        <p className={'light small'}>{meta.amalgam.inferredClass.label}</p>
      </>
    );
  } else return null;
}

/**
 * Fragment for Literal Nodes to display their xsd types
 * @param {string} content - content of the Literal to determine datatype
 * @returns {JSX.Element} - the HTML fragment of Type information
 */
export function ItemLiteralType({content}) {
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

// visual variants for the SelectedItemViewer buttons
const buttonVariants = {
  Yes: {backgroundColor: '#b3b3b3'},
  No: {backgroundColor: '#9c9c9c'}
};

/**
 * Button for making a Node bound to the SPARQL SELECT, known as a SelectedUnknown in the code.
 * @param {Object} props - contains type information and function for propagating the bound change to the graph
 * @returns {JSX.Element} - HTML fragment for a button
 */
export function BoundUnknownCheckbox(props) {
  const { type } = props;
  const toggleBound = () => props.onBoundChange(type === 'nodeUnknown' ? 'nodeSelectedUnknown' : 'nodeUnknown');
  const isSelected = type === 'nodeSelectedUnknown' ? 'Yes' : 'No';

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

/**
 * Fragment for the SelectedItemViewer responsible for deleting the given node
 * @param {Object} props - contains function for deleting the item from the Canvas and state graph
 * @returns {JSX.Element} - HTML frag for a button
 */
export function DeleteItemButton(props) {
  return (
    <>
      <p>Delete Node</p>
      <div className='button' onClick={() => props.deleteItemCascade()}>
        <p>Delete</p>
      </div>
    </>
  );
}

/**
 * Fragment for a button making an Edge (and its connected Nodes) optional
 * @param {Object} props - information on the optionality of the edge, and function for propagating the change
 * @returns {JSX.Element} - HTML frag that represents a button
 */
export function OptionalTripleButton(props) {
  const optionality = props.isOptional ? 'Yes' : 'No';

  return (
    <>
      <p>Make Optional</p>
      <motion.div className='button' variants={buttonVariants} initial={false} animate={optionality}
                  onClick={() => props.toggleOptionalTriple()}>
        <p>{optionality}</p>
      </motion.div>
    </>
  );
}