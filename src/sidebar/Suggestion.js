import React, {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {ItemDesc, ItemImageHeader, ItemPrefix} from "./ItemViewerComponents";

/**
 * Wrapper function for a generic Suggestion
 * @param props
 * @returns {JSX.Element} - outer layers of the Suggestion
 */
export default function SuggestionWrapper(props) {
  const { type, elem } = props.suggestion;
  const { info } = props;

  const [isOpen, setIsOpen] = useState(false); // is suggestion expanded
  const [isDragged, setIsDragged] = useState(false); //  is suggestion being dragged off the canvas

  const toggleIsOpen = () => setIsOpen(!isOpen);
  const toggleIsDragged = () => setIsDragged(!isDragged);
  const checkSuggestionIsOutsideSidebar = (type, elem, point, offset) => {
    if (offset.x < -300) {
      props.onTransferSuggestionToCanvas(type, elem, point);
    }
  };

  let Suggestion = null;
  if (type.indexOf('edge') !== -1) { // if the selected item is a node
    Suggestion = <SuggestionForSelectedNode type={type} property={elem} info={info}
                                            isOpen={isOpen} isDragged={isDragged} />;
  } else if (type.indexOf('node') !== -1) { // if the  suggested item is an edge
    Suggestion = <SuggestionForSelectedEdge type={type} node={elem} info={info}
                                            isOpen={isOpen} isDragged={isDragged} />;
  } else console.warn("SuggestionWrapper cannot create a suggestion for the given type " + type);

  return (
    <motion.li layout onClick={toggleIsOpen} >
      <motion.div className={'suggestion'} layout
                  drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}
                  onDragStart={toggleIsDragged} onDragTransitionEnd={toggleIsDragged}
                  onDrag={(e, i) =>
                    checkSuggestionIsOutsideSidebar(type, elem, i.point, i.offset) } >
        {Suggestion}
      </motion.div>
    </motion.li>
  );
}

/**
 * Wrapper for Suggestion for a selected Edge - the suggestion would be either a Literal or a Node
 * @param {string} type - type of the suggestion
 * @param {Object} node - the expanded prefix and the name of the suggested node
 * @param {Object} info - further metadata on the node, like it's rdfs:comment
 * @param {boolean} isOpen - is suggestion open?
 * @param {boolean} isDragged - is suggestion being dragged out of the sidebar?
 * @returns {JSX.Element}
 */
function SuggestionForSelectedEdge({type, node, info, isOpen, isDragged}) {
  if (type === 'nodeLiteral') {
    return (<SuggestionAsLiteral node={node} isOpen={isOpen} isDragged={isDragged} />);
  } else {
    return (<SuggestionAsNode node={node} type={type} info={info} isOpen={isOpen} isDragged={isDragged} />);
  }
}

// visual variants for expanded suggestions - gives text a fade-in effect that doesn't clash on open
const variants = {
  vis: {
    opacity: 1,
    transition: {
      duration: 0.5
    }
  },
  invis: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Suggestion of a URI or Unknown
 * @param {string} type - type of the suggestion
 * @param {Object} node - the expanded prefix and the name of the suggested node
 * @param {Object} info - further metadata on the node, like it's rdfs:comment
 * @param {boolean} isOpen - is suggestion open?
 * @param {boolean} isDragged - is suggestion being dragged out of the sidebar?
 * @returns {JSX.Element}
 */
function SuggestionAsNode({ type, node, info, isOpen, isDragged }) {
  const { expansion, label } = node;

  return (
    <>
      <ItemImageHeader type={type} name={label} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
        <motion.div className={"suggestion-extra extra"}
                    variants={variants} initial={'invis'} animate={'vis'} exit={'invis'}>
          <ItemPrefix prefix={expansion}/>
          {info && info.comment &&
            <ItemDesc desc={info.comment} />}
        </motion.div>
        }
      </AnimatePresence>
    </>
  );
}

/**
 * Suggestion of a Literal
 * @param {boolean} isOpen - is suggestion open?
 * @param {boolean} isDragged - is suggestion being dragged out of the sidebar?
 * @param {Object} node - the expanded type prefix and the content of the suggested node
 * @returns {JSX.Element}
 */
function SuggestionAsLiteral({isOpen, isDragged, node}) {
  const { expansion, label } = node;

  return (
    <>
      <ItemImageHeader type={'nodeLiteral'} name={label} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
        <motion.div className={'suggestion-extra extra'}
                    variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
          <ItemPrefix prefix={expansion} />
        </motion.div>
        }
      </AnimatePresence>
    </>
  );
}

/**
 * A Suggestion for the Selected Node - which would be an Edge!
 * @param {string} type - type of the suggested edge
 * @param {Object} info - metadata on the suggested edge, such as it's rdfs:comment
 * @param {Object} property - contains the expansion of the known edges prefix, and the simple name of the Edge
 * @param {boolean} isOpen - is suggestion open?
 * @param {boolean} isDragged - is suggestion being dragged out of the sidebar?
 * @returns {JSX.Element}
 */
function SuggestionForSelectedNode({ type, info, property, isOpen, isDragged }) {
  const { expansion, label } = property;

  return (
    <>
      <ItemImageHeader type={type} name={label} isDragged={isDragged} />
        {isOpen &&
          <motion.div className={'suggestion-extra extra'}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
            <ItemPrefix prefix={expansion} />
            {info && info.comment &&
              <ItemDesc desc={info.comment} />}
        </motion.div>
        }
    </>
  );
}