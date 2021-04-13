import React from 'react';
import './App.css';
import Canvas from "./canvas/Canvas";
import SideBar from "./sidebar/SideBar";
import {AnimateSharedLayout} from "framer-motion";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {type: '', id: '', content: ''},
      transferredSuggestion: {exists: false},
      canvasStateSnapshot: {required: false}
    };
  }


  /**
   *
   * @param {Object} selected - the currently selected object on the canvas with it's associated changes and data.
   * @param {string} selected.type - whether the object changed was a
   *          node (specified by it's variant), edge or datatype.
   * @param {number} selected.id - id of the given changed object.
   * @param {string} selected.content - the changed input of the object.
   */
  handleSelectedItemChange = (selected) => {
    this.setState({selected: selected});
  }

  /**
   *
   * @param type
   * @param elem
   * @param point
   */
  handleTransferSuggestionToCanvas = (type, elem, point) => {
    this.setState({transferredSuggestion: {exists: true, type: type, elem: elem, point: point}});
  }

  handleAknowledgedSuggestion = () => {
    this.setState({transferredSuggestion: {exists: false}});
  }

  handleRequestCanvasState = () => {
    this.setState({canvasStateSnapshot: {required: true}});
  }

  handleAcknowledgedCanvasStateSnapshot = (graph) => {
    this.setState({canvasStateSnapshot: {graph: graph, required: false}});
  }


  render(){
    const { selected, transferredSuggestion, canvasStateSnapshot } = this.state;

    return (
      <AnimateSharedLayout>
        <div className="App">
          <Canvas selected={selected} transferredSuggestion={transferredSuggestion}
                  canvasStateSnapshot={canvasStateSnapshot}
                  onSelectedItemChange={this.handleSelectedItemChange}
                  acknowledgeTransferredSuggestion={this.handleAknowledgedSuggestion}
                  acknowledgeCanvasStateSnapshot={this.handleAcknowledgedCanvasStateSnapshot} />
          <SideBar selected={selected} canvasStateSnapshot={canvasStateSnapshot}
                   onSelectedItemChange={this.handleSelectedItemChange}
                   onTransferSuggestionToCanvas={this.handleTransferSuggestionToCanvas}
                   onRequestCanvasState={this.handleRequestCanvasState}/>
        </div>
      </AnimateSharedLayout>
    );
  }
}

export default App;
