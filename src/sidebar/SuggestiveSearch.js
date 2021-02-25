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
   * @property {Object} range
   * @property {string} range.prefix
   * @property {string} range.name
   * @param {string} content - the content of the selected Edge
   * @returns {EdgeSuggestion[]}
   */
  generateSuggestionsForSelectedEdge(content) {
    const suggestions = [];
    const { elementDefs } = this.state;
    const [ , name ] = content.split(':');

    for (let def of elementDefs) {
      if (def.elem.name === name) {
        suggestions.push({
          type: def.range.prefix === 'http://www.w3.org/2001/XMLSchema' ? 'nodeLiteral' : 'nodeKnown',
          elem: def.range
        });
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
   * @property {string} prefix - prefix of suggested edge
   * @property {string} name - name of suggested edge
   * @param type - type of the node: is it a literal, iri, unknown?
   * @param content - content of the selected node
   * @returns {NodeSuggestion[]}
   */
  generateSuggestionsForSelectedNode(type, content) {
    const suggestions = [];
    const { elementDefs } = this.state;
    const [ , name ] = content.split(':');

    for (let def of elementDefs) {
      if (def.domain.name === name) {
        suggestions.push({type: 'edgeKnown', elem: def.elem});
      }
    }

    return suggestions;
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
            {defsLoaded && infoLoaded && suggestions.map((s, ix) =>
              <SuggestionWrapper key={ix} suggestion={s} info={info[s.elem.iri]} />)}
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
  const { info } = props;

  const [isOpen, setIsOpen] = useState(false);
  const toggleIsOpen = () => setIsOpen(!isOpen);

  //todo: investigate whether we can support suggestions of unknown things?
  let Suggestion = null;
  if (type.indexOf('edge') !== -1) {
    Suggestion = <SuggestionForSelectedNode type={type} property={elem} info={info} isOpen={isOpen} />;
  } else if (type.indexOf('node') !== -1) {
    Suggestion = <SuggestionForSelectedEdge type={type} node={elem} info={info} isOpen={isOpen} />;
  } else if (type === 'datatype') {
    Suggestion = <SuggestionForSelectedDatatype isOpen={isOpen} />;
  } else console.warn("SuggestionWrapper cannot create a suggestion for the given type " + type);

  return (
    <motion.li layout onClick={toggleIsOpen}>
      {Suggestion}
    </motion.li>
  );
}

function SuggestionForSelectedEdge(props) {
  const { type, node, isOpen } = props;

  if (type === 'nodeLiteral') {
    return (<SuggestionAsLiteral node={node} isOpen={isOpen} />);
  } else {
    const { info } = props;
    return (<SuggestionAsNode node={node} info={info} isOpen={isOpen} />);
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
  const { info, node, isOpen } = props;
  const { prefix, name } = node;

  return (
    <motion.div className={'suggestion'} layout
                drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}>
      <ItemImageHeader type={'nodeUri'} name={name} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={"suggestion-extra extra"}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'}>
            <ItemPrefix prefix={prefix}/>
            {info ? <ItemDesc desc={info.comment} /> : null }
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>
  );
}

function SuggestionAsLiteral(props) {
  const { prefix, name } = props.node;
  const { isOpen } = props;

  return (
    <motion.div className={'suggestion'} layout
                drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}>
      <ItemImageHeader type={'nodeLiteral'} name={name} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={'suggestion-extra extra'}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
            <ItemPrefix prefix={prefix} />
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>
  );
}

function SuggestionForSelectedDatatype(props) {
  return (
    <motion.div className={'suggestion'} layout
                drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}>
      <motion.p>Placeholder Datatype suggestion {props}</motion.p>
    </motion.div>
  );
}

function SuggestionForSelectedNode(props) {
  const { type, info, isOpen } = props;
  const { prefix, name } = props.property;

  return (
    <motion.div className={'suggestion'} layout
                drag dragPropagation dragConstraints={{top: 0, left: 0, right: 0, bottom: 0}} dragElastic={1}>
      <ItemImageHeader type={type} name={name} />
      <AnimatePresence>
        {isOpen &&
          <motion.div className={'suggestion-extra extra'}
                      variants={variants} initial={'invis'} animate={'vis'} exit={'invis'} >
            <ItemPrefix prefix={prefix} />
            {info ? <ItemDesc desc={info.comment} /> : null}
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>
  );
}