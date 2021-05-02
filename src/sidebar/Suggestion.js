import React, {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {ItemDesc, ItemImageHeader, ItemPrefix} from "./ItemViewerComponents";

export default function SuggestionWrapper(props) {
  const { type, elem } = props.suggestion;
  const { info } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isDragged, setIsDragged] = useState(false);

  const toggleIsOpen = () => setIsOpen(!isOpen);
  const toggleIsDragged = () => setIsDragged(!isDragged);
  const checkSuggestionIsOutsideSidebar = (type, elem, point, offset) => {
    if (offset.x < -300) {
      props.onTransferSuggestionToCanvas(type, elem, point);
    }
  };

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
                    checkSuggestionIsOutsideSidebar(type, elem, i.point, i.offset) } >
        {Suggestion}
      </motion.div>
    </motion.li>
  );
}

function SuggestionForSelectedEdge({type, node, info, isOpen, isDragged}) {
  if (type === 'nodeLiteral') {
    return (<SuggestionAsLiteral node={node} isOpen={isOpen} isDragged={isDragged} />);
  } else {
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

function SuggestionAsNode({ info, node, type, isOpen, isDragged }) {
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

function SuggestionForSelectedDatatype(props) {
  return (
    <>
      <motion.p>Placeholder Datatype suggestion {props}</motion.p>
    </>
  );
}

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