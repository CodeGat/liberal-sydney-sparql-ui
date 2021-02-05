import React from 'react';
import {AnimateSharedLayout, motion} from 'framer-motion';
import "./Sidebar.css";

async function submitQuery (url, query) {
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

//todo: is statefullness required if we click on a suggestion?
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
    const { id, type, content } = this.props;

    // generate new suggestions based on the current content
    if (id !== prevProps.id && content !== prevProps.content && type !== prevProps.type){
      const newSuggestions = [];
      const { elementDefs } = this.state;

      for (let def of elementDefs){
        if (def.elem.name === this.props.name){
          newSuggestions.push({type: "data", range: def.range});
        }
      }

      this.setState({suggestions: newSuggestions});
    }
  }

  componentDidMount() {
    // when component mounts, fetch ontology and the associated data, caching it
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local uri
    submitQuery(base_url, "SELECT ?s ?domain ?range WHERE {" +
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
              <Suggestion key={ix}
                          label={suggestion.label} description={suggestion.description} type={suggestion.type}
                          domain={suggestion.domain} range={suggestion.range} />)}
            {!isLoaded &&
              <p>Loading...</p>}
          </motion.ul>
        </AnimateSharedLayout>
      </div>
    );
  }
}

function Suggestion(props) {
  const { label, description, type, domain, range } = props;

  return (
    <motion.div>

    </motion.div>
  );
}