import React, {useState} from "react";
import { submitQuery, fetchPrefixOfExpansion } from "./UtilityFunctions";
import {ItemDesc, ItemImageHeader, ItemPrefix} from "./ItemViewerComponents";
import {AnimatePresence, AnimateSharedLayout, motion} from "framer-motion";
import './Sidebar.css';
import './SuggestiveSearch.css';

export default class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      elementDefs: [],
      defsLoaded: false,
      suggestionNo: 0
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { id, type, content } = this.props;

    if (content !== prevProps.content || id !== prevProps.id || type !== prevProps.type){
      // generate new suggestions based on the current content
      let newSuggestions;

      if (type.indexOf('edge') !== -1) newSuggestions = this.generateSuggestionsForSelectedEdge(content);
      else if (type.indexOf('node') !== -1) newSuggestions = this.generateSuggestionsForSelectedNode(type, content);
      else if (type.indexOf('datatype') !== -1) newSuggestions = this.generateSuggestionsForSelectedDatatype(content);
      else console.warn("Couldn't find suggestions for the selected item as it's type is not known");

      this.setState({suggestions: newSuggestions});
    }
  }

  /**
   * Generates suggestions for the currently selected Edge
   * @typedef {Object} EdgeSuggestion
   * @property {string} type - type of the suggestion (either a literal or a known iri)
   * @property {Object} elem - range of the suggested Node
   * @property {number} ix - suggestion index
   * @param {string} content - the content of the selected Edge
   * @returns {EdgeSuggestion[]}
   */
  generateSuggestionsForSelectedEdge(content) {
    const suggestions = [];
    const { elementDefs, suggestionNo } = this.state;
    const contentSegments = content.split(':');
    const name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];
    let ix = suggestionNo;

    for (let def of elementDefs) {
      if (def.elem.label === name) {
        suggestions.push({
          type: def.range.expansion === 'http://www.w3.org/2001/XMLSchema' ? 'nodeLiteral' : 'nodeUri',
          elem: def.range,
          ix: ix
        });
        ix++;
      }
    }

    this.setState({suggestionNo: ix});

    return suggestions;
  }

  /**
   * Generates suggestions for the currently selected Datatype
   * @typedef {Object} DatatypeSuggestion
   * @property {string} prefix
   * @property {string} name
   * @param content - content of the datatype
   * @returns {DatatypeSuggestion[]}
   */
  generateSuggestionsForSelectedDatatype(content) {
    console.warn("generateSuggestionsForSelectedDatatype unimplemented");
    return [];
  }

  /**
   * Generates suggestions for the currently selected Node
   * @typedef {Object} NodeSuggestion
   * @property {string} type - type of suggestion for a Node (namely, a known edge)
   * @property {Object} elem - the Node suggestion
   * @property {number} ix - suggestion index
   * @param type - type of the node: is it a literal, iri, unknown?
   * @param content - content of the selected node
   * @returns {NodeSuggestion[]}
   */
  generateSuggestionsForSelectedNode(type, content) {
    if (type === 'nodeLiteral') return [];

    const suggestions = [];
    const { elementDefs, suggestionNo } = this.state;
    const contentSegments = content.split(':');
    const name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];
    let ix = suggestionNo;

    for (let def of elementDefs) {
      if (def.domain.label === name) {
        suggestions.push({type: 'edgeKnown', elem: def.elem, ix: ix});
        ix++;
      }
    }

    this.setState({suggestionNo: ix});

    return suggestions;
  }

  /**
   * Deletes a suggestion located at ix from the state array of suggestions.
   * @param ix - the index of the suggestion about to be deleted
   */
    //todo: deletes suggestions of the NEXT!! Remove...?
  deleteSuggestion = (ix) => {
    this.setState(old => ({
      suggestions: old.suggestions.filter(s => s.ix !== ix)
    }));
  }

  componentDidMount() {
    // when component mounts, fetch ontology and the associated data, caching it
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local uri
    submitQuery(base_url, "SELECT DISTINCT ?s ?domain ?range WHERE {" +
      "OPTIONAL {?s rdfs:domain [ owl:onClass ?domain ] . FILTER (?s != owl:topObjectProperty) } " +
      "OPTIONAL {?s rdfs:range  [ owl:onClass|owl:onDataRange|owl:someValuesFrom ?range ] } }")
      .then(
        response => {
          const results = response.results.bindings;
          const defs = [];
          const myPrefixes = {};

          for (const { s, domain, range } of results) {
            const [ sExpansion, sName ] = s.value.split("#");
            const [ dExpansion, dName ] = domain.value.split("#");
            const [ rExpansion, rName ] = range.value.split("#");
            const sLabel = sName.replace(/_/g, ' ');
            const dLabel = dName.replace(/_/g, ' ');
            const rLabel = rName.replace(/_/g, ' ');

            const sPrefix = this.findPrefixOfExpansion(sExpansion, myPrefixes);
            const dPrefix = this.findPrefixOfExpansion(dExpansion, myPrefixes);
            const rPrefix = this.findPrefixOfExpansion(rExpansion, myPrefixes);

            defs.push({
              elem: {iri: s.value, expansion: sExpansion, prefix: sPrefix, name: sName, label: sLabel},
              domain: {iri: domain.value, expansion: dExpansion, prefix: dPrefix, name: dName, label: dLabel},
              range: {iri: range.value, expansion: rExpansion, prefix: rPrefix, name: rName, label: rLabel}
            });
          }
          this.setState({defsLoaded: true, elementDefs: defs});
        },
        error => this.setState({defsLoaded: true, error})
      );
  }

  findPrefixOfExpansion = (expansion, cachedPrefixes) => {
    let prefix;
    const { basePrefix } = this.props;

    if (expansion === basePrefix) {
      prefix = '';
    } else if (cachedPrefixes[expansion]) {
      console.log(expansion + ' was cached prefix');
      prefix = cachedPrefixes[expansion];
    } else {
      fetchPrefixOfExpansion(expansion)
        .then(res => {
          if (res.success) {
            const onlyPrefix = res.value.split("#")[0];

            cachedPrefixes[expansion] = onlyPrefix;
            prefix = onlyPrefix;
          }
        });
    }

    return prefix;
  }

  render(){
    const { suggestions, defsLoaded } = this.state;
    const { info, infoLoaded } = this.props;

    return (
      <div>
        <AnimateSharedLayout>
          <motion.ul layout>
            {defsLoaded && infoLoaded && suggestions && suggestions.map(s =>
              <SuggestionWrapper key={s.ix} ix={s.ix} suggestion={s} info={info[s.elem.iri]}
                                 onDeleteSuggestionFromSidebar={this.deleteSuggestion}
                                 onTransferSuggestionToCanvas={this.props.onTransferSuggestionToCanvas} />)}
            {(!defsLoaded || !infoLoaded) &&
            <p>Loading...</p>}
          </motion.ul>
        </AnimateSharedLayout>
      </div>
    );
  }
}

//todo: maybe use more hooks like this?
function SuggestionWrapper(props) {
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
    return (<SuggestionAsNode node={node} info={info} isOpen={isOpen} isDragged={isDragged} />);
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
  const { info, node, isOpen, isDragged } = props;
  const { expansion, label } = node;

  return (
    <>
      <ItemImageHeader type={'nodeUri'} name={label} isDragged={isDragged} />
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