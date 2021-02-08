import React from 'react';
import { AnimateSharedLayout, motion } from 'framer-motion';
import { submitQuery, fetchExpansionOfPrefix, fetchPrefixOfExpansion } from './UtilityFunctions'
import "./Sidebar.css";
import arrowImg from './arrow_icon_black.png';
import nodeImg from './node_icon_known.png';
import litImg from './literal_icon_known.png';

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

//todo: prefix, name, desc, domain, range, from (in case of ?)
class SelectedItemViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedPrefix: ''
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { prefix } = this.props;

    if (prevProps.prefix !== prefix) {
      fetchExpansionOfPrefix(prefix)
        .then(
          data => this.setState({expandedPrefix: data[prefix]}),
          error => this.setState(error))
    }
  }

  render() {
    const { type, prefix, name } = this.props;
    const  { expandedPrefix } = this.state;

    return (
      <div id={'itemviewer'}>
        {type !== '' &&
          <>
            <SelectedItemViewerImage type={type} />
            <p className={'grid-name'}>{name}</p>
            <p className={'grid-from'}>From</p>
            <p className={'grid-prefix light small'}>{expandedPrefix}</p>
          </>}
      </div>
    );
  }
}

function SelectedItemViewerImage(props) {
  const { type } = props;

  if (type === 'uri') {
    return (<img className={'grid-img'} src={nodeImg} alt={'selected known node icon'}/>);
  } else if (type === 'edge') {
    return (<img className={'grid-img'} src={arrowImg} alt={'selected known edge icon'}/>);
  } else if (type === 'literal') {
    return (<img className={'grid-img'} src={litImg} alt={'selected known literal icon'}/>);
  } else {
    console.warn("Unknown selected item - not explicitly a node, edge or literal");
    return null;
  }
}

class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      elementDefs: [],
      info: {},
      isDefsLoaded: false,
      isInfoLoaded: false
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
        suggestions.push({
          type: def.range.prefix === 'http://www.w3.org/2001/XMLSchema' ? 'literal' : 'node',
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

  componentDidMount() {
    // when component mounts, fetch ontology and the associated data, caching it
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local uri
    submitQuery(base_url, "SELECT DISTINCT ?s ?domain ?range WHERE {" +
      "OPTIONAL {?s rdfs:domain [ owl:onClass ?domain ] } ." +
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
          this.setState({isDefsLoaded: true, elementDefs: defs});
        },
        error => this.setState({isDefsLoaded: true, error})
      );

    submitQuery(base_url, "SELECT DISTINCT ?s ?label ?comment WHERE { " +
      "  OPTIONAL { ?s rdfs:label ?label }" +
      "  OPTIONAL { ?s rdfs:comment ?comment } }"
    ).then(
      response => {
        const results = response.results.bindings;
        let comments = {};

        for (const { s, label, comment } of results) {
          comments[s.value] = {label: label.value, comment: comment.value};
        }

        this.setState({isInfoLoaded: true, info: comments});
      },
      error => this.setState({isInfoLoaded: true, error})
    );
  }

  render(){
    const { suggestions, info, isDefsLoaded, isInfoLoaded } = this.state;

    return (
      <div>
        <AnimateSharedLayout>
          <motion.ul layout>
            {isDefsLoaded && isInfoLoaded && suggestions.map((s, ix) =>
              <SuggestionWrapper key={ix} suggestion={s} info={info[s.elem.iri]} />)}
            {(!isDefsLoaded || !isInfoLoaded) &&
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

  if (type === 'edge') {
    return (<SuggestionForSelectedNode type={type} property={elem} info={info}/>);
  } else if (type === 'datatype') {
    return (<SuggestionForSelectedDatatype />);
  } else {
    return (<SuggestionForSelectedEdge type={type} node={elem} info={info}/>);
  }
}

//todo: can be literals, known, unknown, optional......
function SuggestionForSelectedEdge(props) {
  const { type, node } = props;

  if (type === 'literal') {
    return (<SuggestionAsLiteral node={node}/>);
  } else {
    const { info } = props;
    return (<SuggestionAsNode node={node} info={info} />);
  }
}

function SuggestionAsNode(props) {
  const { prefix, name } = props.node;
  const { label, comment } = props.info;

  return (
    <div className={'suggestion'}>
      <img className={'grid-img'} src={nodeImg} alt={'known node icon'} />
      <p className={'grid-name'}>{name}</p>
      <p className={"grid-from small"}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
      <p className={'grid-desc small'}>Desc.</p>
      <p className={'grid-description light small'}>{comment}</p>
    </div>
  );
}

function SuggestionAsLiteral(props) {
  const { prefix, name } = props.node;

  return (
    <div className={'suggestion'}>
      <img className={'grid-img'} src={litImg} alt={'known literal icon'} />
      <p className={'grid-name'}>{name}</p>
      <p className={'grid-from small'}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
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
  const { type } = props;
  const { prefix, name } = props.property;
  const { label, comment } = props.info;

  return (
    <div className={'suggestion'}>
      <img className={'grid-img'} src={arrowImg} alt={"known property icon"} />
      <p className={'grid-name'}>{name}</p>
      <p className={"grid-from small"}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
      <p className={'grid-desc small'}>Desc.</p>
      <p className={'grid-description light small'}>{comment}</p>
    </div>
  );
}