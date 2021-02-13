import React from "react";
import { submitQuery } from "./UtilityFunctions";
import {ItemDesc, ItemImageHeader, ItemPrefix} from "./ItemViewerComponents";
import {AnimateSharedLayout, motion} from "framer-motion";
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

function SuggestionWrapper(props) {
  const { type, elem } = props.suggestion;
  const { info } = props;

  //todo: investigate whether we can support suggestions of unknown things?
  if (type.indexOf('edge') !== -1) {
    return (<SuggestionForSelectedNode type={type} property={elem} info={info}/>);
  } else if (type.indexOf('node') !== -1) {
    return (<SuggestionForSelectedEdge type={type} node={elem} info={info}/>);
  } else if (type === 'datatype') {
    return (<SuggestionForSelectedDatatype />);
  } else {
    console.warn("Suggestion type does not conform in SuggestionWrapper");
  }
}

function SuggestionForSelectedEdge(props) {
  const { type, node } = props;

  if (type === 'nodeLiteral') {
    return (<SuggestionAsLiteral node={node}/>);
  } else {
    const { info } = props;
    return (<SuggestionAsNode node={node} info={info} />);
  }
}

function SuggestionAsNode(props) {
  const { info, node } = props;
  const { prefix, name } = node;
  let label, comment;

  if (info) {
    label = info.label;
    comment = info.comment;
  }

  return (
    <div className={'suggestion'}>
      <ItemImageHeader type={'nodeKnown'} name={name} />
      <ItemPrefix prefix={prefix}/>
      {comment !== undefined &&
        <ItemDesc desc={info} />
      }
    </div>
  );
}

function SuggestionAsLiteral(props) {
  const { prefix, name } = props.node;

  return (
    <div className={'suggestion'}>
      <ItemImageHeader type={'nodeLiteral'} name={name} />
      <ItemPrefix prefix={prefix} />
    </div>
  );
}

function SuggestionForSelectedDatatype(props) {
  return (
    <div className={'suggestion'}>
      <p>Placeholder Datatype suggestion {props}</p>
    </div>
  );
}

function SuggestionForSelectedNode(props) {
  const { type, info } = props;
  const { prefix, name } = props.property;
  let label, comment;

  if (info) {
    label = info.label;
    comment = info.comment;
  }

  return (
    <div className={'suggestion'}>
      <ItemImageHeader type={type} name={name} />
      <ItemPrefix prefix={prefix} />
      {comment !== undefined &&
        <ItemDesc desc={comment} />
      }
    </div>
  );
}