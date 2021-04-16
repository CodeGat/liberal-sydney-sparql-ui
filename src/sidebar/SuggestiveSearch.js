import React from "react";
import SuggestionWrapper from "./Suggestion";
import { submitQuery, fetchPrefixOfExpansion } from "./UtilityFunctions";
import { AnimateSharedLayout, motion} from "framer-motion";
import './Sidebar.css';
import './SuggestiveSearch.css';

export default class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      elementDefs: [],
      baseClasses: [],
      defsLoaded: false,
      suggestionNo: 0
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { id, type, content, basePrefixLoaded } = this.props;
    const { defsLoaded, baseClasses } = this.state;

    if (content !== prevProps.content || id !== prevProps.id || type !== prevProps.type){
      // generate new suggestions based on the current content
      let newSuggestions;

      if (type.indexOf('edge') !== -1) newSuggestions = this.generateSuggestionsForSelectedEdge(content);
      else if (type.indexOf('node') !== -1) newSuggestions = this.generateSuggestionsForSelectedNode(type, content);
      else if (type.indexOf('datatype') !== -1) newSuggestions = this.generateSuggestionsForSelectedDatatype(content);
      else console.warn("Couldn't find suggestions for the selected item as it's type is not known");

      this.setState({suggestions: newSuggestions});
    }
    if (!prevProps.basePrefixLoaded && basePrefixLoaded){
      this.updateStateWithOntologyData();
    }
    if (!prevState.defsLoaded && defsLoaded){
      const baseClassSuggestions = this.generateSuggestionsOfBaseClasses(baseClasses);

      this.setState({suggestions: baseClassSuggestions});
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
    let ix = suggestionNo;

    if (content.match(/(rdf:)?type|^a/)){
      const { baseClasses } = this.state;
      const baseClassSuggestions = this.generateSuggestionsOfBaseClasses(baseClasses);

      console.log(baseClassSuggestions);

      suggestions.push(...baseClassSuggestions);
    } else {
      const contentSegments = content.split(':');
      const name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];

      suggestions.push({
        type: 'nodeUnknown',
        elem: {label: '?'},
        ix: ix++
      });

      for (let def of elementDefs) {
        if (def.elem.label === name) {
          suggestions.push({
            type: def.range.expansion === 'http://www.w3.org/2001/XMLSchema' ? 'nodeLiteral' : 'nodeUri',
            elem: def.range,
            ix: ix++
          });
        }
      }

      this.setState({suggestionNo: ix});
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
    const suggestions = [];
    const { elementDefs, suggestionNo } = this.state;
    let ix = suggestionNo;

    if (type === 'nodeLiteral') {
      return [];
    } else if (type === 'nodeUnknown') { //todo: make this have suggestions of base class referred to in rdf:type
      suggestions.push({
        type: 'edgeKnown',
        elem: {
          iri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          prefix: 'rdf',
          label: 'type'
        },
        ix: ix++
      });

      return suggestions;
    } else {
      const contentSegments = content.split(':');
      const name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];

      for (let def of elementDefs) {
        if (def.domain && def.domain.label === name) {
          suggestions.push({type: 'edgeKnown', elem: def.elem, ix: ix});
          ix++;
        }
      }
    }

    this.setState({suggestionNo: ix});

    return suggestions;
  }

  /**
   * Converts all base classes of the base ontology into suggestions.
   * @param {Array<Object>} baseClasses - classes of the base ontology.
   * @returns {Array<Object>} - suggestions based on Base Classes of the Ontology.
   */
  generateSuggestionsOfBaseClasses = (baseClasses) => {
    const suggestions = [];
    const { suggestionNo } = this.state;
    let ix = suggestionNo;

    suggestions.push({
      type: 'nodeUnknown',
      elem: {
        label: '?'
      },
      ix: ix++
    });

    for (const baseClass of baseClasses) {
      suggestions.push({
        type: 'nodeUri',
        elem: baseClass,
        ix: ix++
      });
    }

    this.setState({suggestionNo: ix});

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

  updateStateWithOntologyData = () => {
    // when component mounts, fetch ontology and the associated data, caching it
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local uri
    submitQuery(base_url, "SELECT DISTINCT ?s ?klass ?domain ?range WHERE {" +
      "OPTIONAL {?s rdf:type ?klass . FILTER (?klass = owl:ObjectProperty || ?klass = owl:Class) }" +
      "OPTIONAL {?s rdfs:domain [ owl:onClass ?domain ] . FILTER (?s != owl:topObjectProperty) } " +
      "OPTIONAL {?s rdfs:range  [ owl:onClass|owl:onDataRange|owl:someValuesFrom ?range ] } }")
      .then(
        response => {
          const results = response.results.bindings;
          const defs = [];
          const baseClasses = [];
          const myPrefixes = {};

          for (const { s, klass, domain, range } of results) {
            const def = {};

            const [ sExpansion, sName ] = s.value.split("#");
            const sLabel = sName.replace(/_/g, ' ');
            const sPrefix = this.findPrefixOfExpansion(sExpansion, myPrefixes);
            def.elem = {iri: s.value, expansion: sExpansion, prefix: sPrefix, name: sName, label: sLabel};

            if (domain) {
              const [ dExpansion, dName ] = domain.value.split("#");
              const dLabel = dName.replace(/_/g, ' ');
              const dPrefix = this.findPrefixOfExpansion(dExpansion, myPrefixes);
              def.domain = {iri: domain.value, expansion: dExpansion, prefix: dPrefix, name: dName, label: dLabel};
            }
            if (range) {
              const [ rExpansion, rName ] = range ? range.value.split("#") : [null, null];
              const rLabel = rName.replace(/_/g, ' ');
              const rPrefix = this.findPrefixOfExpansion(rExpansion, myPrefixes);
              def.range = {iri: range.value, expansion: rExpansion, prefix: rPrefix, name: rName, label: rLabel};
            }
            if (klass && klass.value.split('#')[1] === 'Class') {
              baseClasses.push({...def.elem});
            }

            defs.push(def);
          }
          this.setState({defsLoaded: true, elementDefs: defs, baseClasses: baseClasses});
        },
        error => this.setState({defsLoaded: true, error})
      );
  }

  //todo: find a better way to cache incoming responses
  findPrefixOfExpansion = (expansion, cachedPrefixes) => {
    let prefix;
    const { basePrefix, basePrefixLoaded } = this.props;

    if (expansion === basePrefix) {
      prefix = '';
    } else if (cachedPrefixes[expansion]) {
      console.log(expansion + ' was cached prefix');
      prefix = cachedPrefixes[expansion];
    } else if (basePrefixLoaded) {
      fetchPrefixOfExpansion(expansion)
        .then(res => {
          if (res.success) {
            const onlyPrefix = res.value.split("#")[0];

            cachedPrefixes[expansion] = onlyPrefix;
            prefix = onlyPrefix;
          } else {
            cachedPrefixes[expansion] = '';
            prefix = '';
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
              <SuggestionWrapper key={s.ix} ix={s.ix} suggestion={s} info={s.elem ? info[s.elem.iri] : undefined}
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
