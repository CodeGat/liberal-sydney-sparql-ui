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
      infoLoaded: false
    };
  }

  componentDidMount() {
    const base_url = "http://localhost:9999/blazegraph/sparql"; //todo: remove local url
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

  handleSelectedItemChange(event){
    this.props.onSelectedItemChange(event.target.value);
  }

  render(){
    const { content, type, id } = this.props.selected;
    const { info, infoLoaded } = this.state;

    return (
      <div className="sidebar">
        <SelectedItemViewer type={type} content={content}
                            info={info} infoLoaded={infoLoaded} />
        <SuggestiveSearch id={id} type={type} content={content}
                          info={info} infoLoaded={infoLoaded} />
      </div>
    );
  }
}
