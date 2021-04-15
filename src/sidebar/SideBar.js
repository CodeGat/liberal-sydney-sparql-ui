import React from 'react';
import { submitQuery } from './UtilityFunctions'
import "./Sidebar.css";
import SelectedItemViewer from "./SelectedItemViewer";
import SuggestiveSearch from "./SuggestiveSearch";

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: {},
      infoLoaded: false,
      basePrefix: '',
      basePrefixLoaded: false,
      error: ''
    };
  }

  componentDidMount() {
    const base_url = "http://localhost:9999/blazegraph/sparql";
    // const base_url = "https://lmb.cdhr.anu.edu.au/blazegraph/sparql";
    submitQuery(base_url, "SELECT DISTINCT ?s WHERE { ?s a owl:Ontology } LIMIT 1"
    ).then(
      response => {
        const results = response.results.bindings;

        if (results.length > 0) {
          this.setState({basePrefix: results[0].s.value, basePrefixLoaded: true});
        } else {
          this.setState({basePrefix: 'Unknown', basePrefixLoaded: true});
        }
      },
      error => {
        console.warn(error);
        this.setState({error: error});
      }
    );

    submitQuery(base_url, "SELECT DISTINCT ?s ?label ?comment WHERE { " +
      "  OPTIONAL { ?s rdfs:label ?label }" +
      "  OPTIONAL { ?s rdfs:comment ?comment } }"
    ).then(
      response => {
        const results = response.results.bindings;
        let info = {};

        for (const { s, label, comment } of results) {
          info[s.value] = {label: label.value, comment: comment.value};
        }

        this.setState({infoLoaded: true, info: info});
      },
      error => this.setState({infoLoaded: true, error})
    );
  }

  render(){
    const { content, type, id } = this.props.selected;
    const { info, infoLoaded, basePrefix, basePrefixLoaded, error } = this.state;

    return (
      <div className="sidebar">
        {error && <p className={'error'}>{error.toString()}</p>}
        <SelectedItemViewer type={type} content={content} basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                            info={info} infoLoaded={infoLoaded} />
        <hr />
        <SuggestiveSearch id={id} type={type} content={content}
                          basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                          info={info} infoLoaded={infoLoaded}
                          onTransferSuggestionToCanvas={this.props.onTransferSuggestionToCanvas} />
      </div>
    );
  }
}
