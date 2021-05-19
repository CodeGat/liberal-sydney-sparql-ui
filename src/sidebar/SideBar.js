import React from 'react';
import { submitQuery } from './UtilityFunctions'
import "./Sidebar.css";
import SelectedItemViewer from "./SelectedItemViewer";
import SuggestiveSearch from "./SuggestiveSearch";
import ExecuteQuerySection from "./QueryExecutor";

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

  /**
   * Sets the triple with the given edgeId to be SPARQL OPTIONAL or not in the graph.
   * @param {number} edgeId - the id of the edge of the triple whose OPTIONALity will be modified.
   * @param {boolean} updatedIsOptional - the new isOptional value
   */
  setOptionalTriple = (edgeId, updatedIsOptional) => {
    const { graph } = this.props;

    const edge = graph.edges.find(edge => edge.id === edgeId);

    console.log(`setting optional: subject ${edge.subject.id} edge ${edgeId} object ${edge.object.id} to ${updatedIsOptional}`);

    this.props.changeEdgeState(edgeId, {isOptional: updatedIsOptional});
    this.props.changeNodeState(edge.subject.id, {isOptional: updatedIsOptional});
    this.props.changeNodeState(edge.object.id, {isOptional: updatedIsOptional});
    this.props.onSelectedItemChange(edge.type, edge.id, edge.content, updatedIsOptional, edge.meta);
  }

  render(){
    const { graph, canvasStateSnapshot } = this.props;
    const { content, type, id, isOptional, meta } = this.props.selected;
    const { info, infoLoaded, basePrefix, basePrefixLoaded, error } = this.state;

    return (
      <div className="sidebar">
        {error && <p className={'error'}>{error.toString()}</p>}
        <SelectedItemViewer id={id} type={type} content={content} isOptional={isOptional} meta={meta}
                            basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                            info={info} infoLoaded={infoLoaded}
                            deleteItemCascade={this.props.deleteItemCascade}
                            setOptionalTriple={this.setOptionalTriple}
                            onSelectedItemChange={this.props.onSelectedItemChange}
                            changeNodeState={this.props.changeNodeState} />
        <SuggestiveSearch id={id} type={type} content={content} meta={meta} graph={graph}
                          basePrefix={basePrefix} basePrefixLoaded={basePrefixLoaded}
                          info={info} infoLoaded={infoLoaded}
                          onTransferSuggestionToCanvas={this.props.onTransferSuggestionToCanvas} />
        <ExecuteQuerySection canvasState={canvasStateSnapshot}
                            requestCanvasState={this.props.onRequestCanvasState} />
      </div>
    );
  }
}
