import React, {useState} from "react";
import { submitQuery } from "./UtilityFunctions";
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
    const { elementDefs } = this.state;
    const [ , name ] = content.split(':');
    let ix = 0;

    for (let def of elementDefs) {
      if (def.elem.name === name) {
        suggestions.push({
          type: def.range.prefix === 'http://www.w3.org/2001/XMLSchema' ? 'nodeLiteral' : 'nodeKnown',
          elem: def.range,
          ix: ix
        });
        ix++;
      }
    }

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
    const suggestions = [];
    const { elementDefs } = this.state;
    const [ , name ] = content.split(':');
    let ix = 0;

    for (let def of elementDefs) {
      if (def.domain.name === name) {
        suggestions.push({type: 'edgeKnown', elem: def.elem, ix: ix});
        ix++;
      }
    }

    return suggestions;
  }

  /**
   * Deletes a suggestion located at ix from the state array of suggestions.
   * @param ix - the index of the suggestion about to be deleted
   */
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

          for (const { s, domain, range } of results) {
            const [ sPrefix, sName ] = s.value.split("#");
            const [ dPrefix, dName ] = domain.value.split("#");
            const [ rPrefix, rName ] = range.value.split("#");

            defs.push({
              elem: {iri: s.value, prefix: sPrefix, name: sName},
              domain: {iri: domain.value, prefix: dPrefix, name: dName},
              range: {iri: range.value, prefix: rPrefix, name: rName}
            });
          }
          this.setState({defsLoaded: true, elementDefs: defs});
        },
        error => this.setState({defsLoaded: true, error})
      );
  }

  render(){
    const { suggestions, defsLoaded } = this.state;
    const { info, infoLoaded } = this.props;

    return (
      <div>
        <AnimateSharedLayout>
          <motion.ul layout>
            {defsLoaded && infoLoaded && suggestions.map(s =>
              <SuggestionWrapper key={s.ix} ix={s.ix} suggestion={s} info={info[s.elem.iri]}
                                 onDeleteSuggestion={(ix) => this.deleteSuggestion(ix)} />)}
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
                  onDragStart={toggleIsDragged} onDragTransitionEnd={toggleIsDragged}>
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
  const { prefix, name } = node;

  return (
    <>
      <ItemImageHeader type={'nodeUri'} name={name} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={"suggestion-extra extra"}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'}>
            <ItemPrefix prefix={prefix}/>
            {info && <ItemDesc desc={info.comment} />}
          </motion.div>
        }
      </AnimatePresence>
    </>
  );
}

function SuggestionAsLiteral(props) {
  const { prefix, name } = props.node;
  const { isOpen, isDragged } = props;

  return (
    <>
      <ItemImageHeader type={'nodeLiteral'} name={name} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={'suggestion-extra extra'}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
            <ItemPrefix prefix={prefix} />
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
  const { prefix, name } = props.property;

  return (
    <>
      <ItemImageHeader type={type} name={name} isDragged={isDragged} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={'suggestion-extra extra'}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
            <ItemPrefix prefix={prefix} />
            {info && <ItemDesc desc={info.comment} />}
          </motion.div>
        }
      </AnimatePresence>
    </>
  );
}