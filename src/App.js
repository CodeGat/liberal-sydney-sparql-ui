import React from 'react';
import './App.css';
import Canvas from "./canvas/Canvas";
import SideBar from "./sidebar/SideBar";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selected: {type: '', id: '', content: ''}};
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

  render(){
    const { selected } = this.state;

    return (
      <div className="App">
        <Canvas selected={selected} onSelectedItemChange={this.handleSelectedItemChange}/>
        <SideBar selected={selected} onSelectedItemChange={this.handleSelectedItemChange}/>
      </div>
    );
  }
}

export default App;
