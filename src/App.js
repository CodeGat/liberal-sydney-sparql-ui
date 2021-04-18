import React from 'react';
import './App.css';
import Canvas from "./canvas/Canvas";
import SideBar from "./sidebar/SideBar";
import {AnimateSharedLayout} from "framer-motion";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {type: '', id: '', content: '', meta: ''},
      transferredSuggestion: {exists: false},
      lastReferencedUnknown: -1,
      lastReferencedUknownAwaitingClass: false,
      canvasStateSnapshot: {required: false, graph: {id: 0}}
    };
  }


  /**
   *
   * @param {string} type - whether the object changed was a
   *          node (specified by it's variant), edge or datatype.
   * @param {number} id - id of the given changed object.
   * @param {string} content - the changed input of the object.
   * @param {Object} meta - metadata of the selected item.
   */
  handleSelectedItemChange = (type, id, content, meta) => {
    this.setState({selected: {type: type, id: id, content: content, meta: meta}});
  }

  /**
   *
   * @param type
   * @param elem
   * @param point
   */
  handleTransferSuggestionToCanvas = (type, elem, point) => {
    const { lastReferencedUnknownAwaitingClass, lastReferencedUnknown } = this.state;
    const suggestionToTransfer = {
      exists: true,
      type: type,
      elem: elem,
      point: point
    };
    if (lastReferencedUnknownAwaitingClass){
      suggestionToTransfer.amalgamInfo = {id: lastReferencedUnknown, amalgamType: 'UnknownClassAmalgam'};
    }

    this.setState({transferredSuggestion: suggestionToTransfer});
    if (type === 'edgeKnown' && elem.label === 'type') {
      this.setState(old => ({lastReferencedUnknown: old.selected.id, lastReferencedUnknownAwaitingClass: true}));
    }
  }

  handleAcknowledgedSuggestion = () => {
    this.setState({transferredSuggestion: {exists: false}, lastReferencedUnknownAwaitingClass: false});
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
                  acknowledgeTransferredSuggestion={this.handleAcknowledgedSuggestion}
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
