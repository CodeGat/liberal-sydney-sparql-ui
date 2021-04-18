import React, {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {ItemDesc, ItemImageHeader, ItemPrefix} from "./ItemViewerComponents";

export default function SuggestionWrapper(props) {
  const { type, elem } = props.suggestion;
  const { info, ix } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isDragged, setIsDragged] = useState(false);

  const toggleIsOpen = () => setIsOpen(!isOpen);
  const toggleIsDragged = () => setIsDragged(!isDragged);
  const checkSuggestionIsOutsideSidebar = (type, elem, point, offset, ix) => {
    if (offset.x < -300) {
      props.onTransferSuggestionToCanvas(type, elem, point);
      props.onDeleteSuggestionFromSidebar(ix);
    }
  };

  //todo: investigate whether we can support suggestions of unknown things?
  let Suggestion = null;
  if (type.indexOf('edge') !== -1) {
    Suggestion = <SuggestionForSelectedNode type={type} property={elem} info={info}
                                            isOpen={isOpen} isDragged={isDragged} />;
  } else if (type.indexOf('node') !== -1) {
    Suggestion = <SuggestionForSelectedEdge type={type} node={elem} info={info}
                                            isOpen={isOpen} isDragged={isDragged} />;
  } else if (type === 'datatype') {
    Suggestion = <SuggestionForSelectedDatatype isOpen={isOpen} isDragged={isDragged} />;
  } else console.warn("SuggestionWrapper cannot create a suggestion for the given type " + type);

  return (
    <motion.li layout onClick={toggleIsOpen} >
      <motion.div className={'suggestion'} layout
                  drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}
                  onDragStart={toggleIsDragged} onDragTransitionEnd={toggleIsDragged}
                  onDrag={(e, i) =>
                    checkSuggestionIsOutsideSidebar(type, elem, i.point, i.offset, ix) } >
        {Suggestion}
      </motion.div>
    </motion.li>
  );
}

function SuggestionForSelectedEdge(props) {
  const { type, node, isOpen, isDragged } = props;

  if (type === 'nodeLiteral') {
    return (<SuggestionAsLiteral node={node} isOpen={isOpen} isDragged={isDragged} />);
  } else {
    const { info } = props;
    return (<SuggestionAsNode node={node} type={type} info={info} isOpen={isOpen} isDragged={isDragged} />);
  }
}

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

function SuggestionAsNode(props) {
  const { info, node, type, isOpen, isDragged } = props;
  const { expansion, label } = node;

  return (
    <>
      <ItemImageHeader type={type} name={label} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
        <motion.div className={"suggestion-extra extra"}
                    variants={variants} initial={'invis'} animate={'vis'} exit={'invis'}>
          <ItemPrefix prefix={expansion}/>
          {info && <ItemDesc desc={info.comment} />}
        </motion.div>
        }
      </AnimatePresence>
    </>
  );
}

function SuggestionAsLiteral(props) {
  const { expansion, label } = props.node;
  const { isOpen, isDragged } = props;

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

function SuggestionForSelectedDatatype(props) {
  return (
    <>
      <motion.p>Placeholder Datatype suggestion {props}</motion.p>
    </>
  );
}

function SuggestionForSelectedNode(props) {
  const { type, info, isOpen, isDragged } = props;
  const { expansion, label } = props.property;

  return (
    <>
      <ItemImageHeader type={type} name={label} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
        <motion.div className={'suggestion-extra extra'}
                    variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
          <ItemPrefix prefix={expansion} />
          {info && <ItemDesc desc={info.comment} />}
        </motion.div>
        }
      </AnimatePresence>
    </>
  );
}