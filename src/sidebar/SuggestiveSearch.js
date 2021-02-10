import React from "react";
import {submitQuery} from "./UtilityFunctions";
import {AnimateSharedLayout, motion} from "framer-motion";
import nodeImg from "./node_icon_known.png";
import litImg from "./literal_icon_known.png";
import arrowImg from "./arrow_icon_black.png";

export default class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      elementDefs: [],
      defsLoaded: false,
    };
  }

  // todo: should node type be in there as well? aka, literal string, literal node, ... oh wait, it is!
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { id, type, content } = this.props;

    if (content !== prevProps.content || id !== prevProps.id || type !== prevProps.type){
      // generate new suggestions based on the current content
      let newSuggestions;

      if (type === "edge") newSuggestions = this.generateSuggestionsForSelectedEdge(content);
      else if (type === "datatype") newSuggestions = this.generateSuggestionsForSelectedDatatype(content);
      else newSuggestions = this.generateSuggestionsForSelectedNode(type, content);

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
        suggestions.push({type: 'edge', elem: def.elem});
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
  const { info, node } = props;
  const { prefix, name } = node;
  let label, comment;

  if (info) {
    label = info.label;
    comment = info.comment;
  }

  return (
    <div className={'suggestion'}>
      <img className={'grid-img'} src={nodeImg} alt={'known node icon'} />
      <p className={'grid-name'}>{name}</p>
      <p className={"grid-from small"}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
      {comment !== undefined &&
      <>
        <p className={'grid-desc small'}>Desc.</p>
        <p className={'grid-description light small'}>{comment}</p>
      </>
      }
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
  const { type, info } = props;
  const { prefix, name } = props.property;
  let label, comment;

  if (info) {
    label = info.label;
    comment = info.comment;
  }

  return (
    <div className={'suggestion'}>
      <img className={'grid-img'} src={arrowImg} alt={"known property icon"} />
      <p className={'grid-name'}>{name}</p>
      <p className={"grid-from small"}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
      {comment !== undefined &&
      <>
        <p className={'grid-desc small'}>Desc.</p>
        <p className={'grid-description light small'}>{comment}</p>
      </>
      }
    </div>
  );
}