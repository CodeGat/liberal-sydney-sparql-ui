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
    submitQuery("SELECT DISTINCT ?s WHERE { ?s a owl:Ontology } LIMIT 1")
      .then(
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

    submitQuery("SELECT DISTINCT ?s ?label ?comment WHERE { " +
      "  OPTIONAL { ?s rdfs:label ?label }" +
      "  OPTIONAL { ?s rdfs:comment ?comment } }"
    ).then(
      response => {
        const results = response.results.bindings;
        let info = {};

        if (Object.keys(results[0]).length === 0){ // trivial solution of no bindings - must be no data in database!
          this.setState({infoLoaded: true, error: "Database is empty or has no classes/properties."});
          return;
        }

        for (const { s, label, comment } of results) {
          const tripleInfo = {};
          if (label) tripleInfo.label = label.value;
          if (comment) tripleInfo.comment = comment.value;

          info[s.value] = tripleInfo;
        }

        this.setState({infoLoaded: true, info: info});
      },
      error => this.setState({infoLoaded: true, error})
    );
  }

  render(){
    const { graph } = this.props;
    const { content, type, id, meta } = this.props.selected;
    const { info, infoLoaded, basePrefix, basePrefixLoaded, error } = this.state;

    return (
      <div className="sidebar">
        {error && <p className={'error'}>{error.toString()}</p>}
        <SelectedItemViewer id={id} type={type} content={content} meta={meta}
                            basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                            info={info} infoLoaded={infoLoaded}
                            onSelectedItemChange={this.props.onSelectedItemChange}
                            changeNodeState={this.props.changeNodeState} changeEdgeState={this.props.changeEdgeState}/>
        <hr />
        <SuggestiveSearch id={id} type={type} content={content} meta={meta} graph={graph}
                          basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                          info={info} infoLoaded={infoLoaded}
                          onTransferSuggestionToCanvas={this.props.onTransferSuggestionToCanvas} />
      </div>
    );
  }
}
