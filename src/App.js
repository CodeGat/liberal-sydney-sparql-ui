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
      transferredSuggestion: {exists: false}
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
    this.setState({transferredSuggestion: {exists: true, type: type, elem: elem, point: point}});
  }

  handleAknowledgedSuggestion = () => {
    this.setState({transferredSuggestion: {exists: false}});
  }

  render(){
    const { selected, transferredSuggestion } = this.state;

    return (
      <AnimateSharedLayout>
        <div className="App">
          <Canvas selected={selected} transferredSuggestion={transferredSuggestion}
                  onSelectedItemChange={this.handleSelectedItemChange}
                  acknowledgeTransferredSuggestion={this.handleAknowledgedSuggestion}/>
          <SideBar selected={selected}
                   onSelectedItemChange={this.handleSelectedItemChange}
                   onTransferSuggestionToCanvas={this.handleTransferSuggestionToCanvas}/>
        </div>
      </AnimateSharedLayout>
    );
  }
}

export default App;
