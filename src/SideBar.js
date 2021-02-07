import React from 'react';
import {AnimateSharedLayout, motion} from 'framer-motion';
import "./Sidebar.css";

async function submitQuery(url, query) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
      'Access-Control-Allow-Origin': '*'
    },
    body: new URLSearchParams({'query': query})
  });

  return response.json();
}

/**
 * Attempts to find the given prefix from prefix.cc
 * @param prefix - the prefix to expand
 * @returns {Promise<Response>}
 */
async function fetchPrefix(prefix) {
  return await fetch('http://prefix.cc/' + prefix + '.file.json');
}

//todo: is state required if we click on a suggestion?
export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleSelectedItemChange(event){
    this.props.onSelectedItemChange(event.target.value);
  }

  render(){
    const { content, type, id } = this.props.selected;
    const selectedComponents = content.split(':');
    let prefix = '', name;

    if (selectedComponents.length === 1){
      name = content;
    } else {
      [ prefix, name ] = selectedComponents;
    }

    return (
      <div className="sidebar">
        <SelectedItemViewer type={type} prefix={prefix} name={name} />
        <SuggestiveSearch id={id} type={type} prefix={prefix} name={name} />
      </div>
    );
  }
}

function SelectedItemViewer(props) {
  return (
    <div>
      <p>This is a {props.type}</p>
      <p><span className="lightprefix">{props.prefix}</span>{':' + props.name}</p>
    </div>
  );
}

class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      elementDefs: [],
      isLoaded: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { id, type, prefix, name } = this.props;

    if (name !== prevProps.name || prefix !== prevProps.prefix || id !== prevProps.id || type !== prevProps.type){
      // generate new suggestions based on the current content
      let newSuggestions;

      if (type === "edge") newSuggestions = this.generateSuggestionsForSelectedEdge(prefix, name);
      else if (type === "datatype") newSuggestions = this.generateSuggestionsForSelectedDatatype(prefix, name);
      else newSuggestions = this.generateSuggestionsForSelectedNode(type, prefix, name);

      this.setState({suggestions: newSuggestions});
    }
  }

  //todo: get list of ontology expansions from prefix.cc
  /**
   * Generates suggestions for the currently selected Edge
   * @typedef {Object} EdgeSuggestion
   * @property {Object} range
   * @property {string} range.prefix
   * @property {string} range.name
   * @param {string} prefix - prefix of the edge
   * @param {string} name - name of the edge
   * @returns {EdgeSuggestion[]}
   */
  generateSuggestionsForSelectedEdge(prefix, name) {
    const suggestions = [];
    const { elementDefs } = this.state;

    for (let def of elementDefs) {
      if (def.elem.name === name) {
        suggestions.push({type: 'node', range: def.range});
      }
    }

    return suggestions;
  }

  /**
   * Generates suggestions for the currently selected Datatype
   * @typedef {Object} DatatypeSuggestion
   * @property {string} prefix
   * @property {string} name
   * @param prefix - prefix of the datatype
   * @param name - name of the datatype
   * @returns {DatatypeSuggestion[]}
   */
  generateSuggestionsForSelectedDatatype(prefix, name) {
    return [];
  }

  /**
   * Generates suggestions for the currently selected Node
   * @typedef {Object} NodeSuggestion
   * @property {string} prefix - prefix of suggested edge
   * @property {string} name - name of suggested edge
   * @param type - type of the node: is it a literal, iri, unknown?
   * @param prefix - prefix of the node
   * @param name - name of the node
   * @returns {NodeSuggestion[]}
   */
  generateSuggestionsForSelectedNode(type, prefix, name) {
    const suggestions = [];
    const { elementDefs } = this.state;

    for (let def of elementDefs) {
      if (def.domain.name === name) {
        suggestions.push({type: 'edge', elem: def.elem});
      }
    }

    return suggestions;
  }

  //todo: add desc, label, find shortened ontology (through prefix.cc api)
  componentDidMount() {
    // when component mounts, fetch ontology and the associated data, caching it
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local uri
    submitQuery(base_url, "SELECT DISTINCT ?s ?domain ?range WHERE {" +
      "OPTIONAL {?s rdfs:domain [ owl:onClass ?domain ] } ." +
      "OPTIONAL {?s rdfs:range  [ owl:onClass|owl:onDataRange|owl:someValuesFrom ?range ] } }")
      .then(
        result => {
          const triples = result.results.bindings;
          const defs = [];

          for (let triple of triples) {
            const { s, domain, range } = triple;
            const [ sPrefix, sName ] = s.value.split("#");
            const [ dPrefix, dName ] = domain.value.split("#");
            const [ rPrefix, rName ] = range.value.split("#");

            defs.push({
              elem: {prefix: sPrefix, name: sName},
              domain: {prefix: dPrefix, name: dName},
              range: {prefix: rPrefix, name: rName}
            });
          }
          this.setState({isLoaded: true, elementDefs: defs});
        },
        error => {
          this.setState({isLoaded: true, error});
        }
      );
  }

  render(){
    const { suggestions, isLoaded } = this.state;

    return (
      <div>
        <AnimateSharedLayout>
          <motion.ul layout>
            {isLoaded && suggestions.map((suggestion, ix) =>
              <SuggestionWrapper key={ix} suggestion={suggestion} />)}
            {!isLoaded &&
              <p>Loading...</p>}
          </motion.ul>
        </AnimateSharedLayout>
      </div>
    );
  }
}

function SuggestionWrapper(props) {
  const { suggestion } = props;

  if (suggestion.type === 'edge') {
    const { elem } = props.suggestion;
    return (<SuggestionForSelectedNode property={elem}/>);
  } else if (suggestion.type === 'datatype') {
    return (<SuggestionForSelectedDatatype />);
  } else {
    const { range } = props.suggestion;
    return (<SuggestionForSelectedEdge node={range}/>);
  }
}

function SuggestionForSelectedEdge(props) {
  const { prefix, name } = props.node;

  return (
    <div>
      <p>Edge suggestion: {prefix + ":" + name}</p>
    </div>
  );
}

function SuggestionForSelectedDatatype(props) {
  return (
    <div>
      <p>Placeholder Datatype suggestion {props}</p>
    </div>
  );
}

function SuggestionForSelectedNode(props) {
  const { prefix, name } = props.property;

  return (
    <div>
      <p>Node suggestion: {prefix + ":" + name}</p>
    </div>
  );
}