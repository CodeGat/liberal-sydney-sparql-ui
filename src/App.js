import React from 'react';
import './App.css';
import Canvas from "./Canvas";
import SideBar from "./SideBar";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selected: {id: '', content: ''}};
  }

  handleSelectedItemChange(change){
    this.setState({selected: change});
  }

  render(){
    // const { id, content } = this.state.selected;
    const { content } = this.state.selected;

    return (
      <div className="App">
        <Canvas selected={content} onSelectedItemChange={this.handleSelectedItemChange}/>
        <SideBar selected={content} onSelectedItemChange={this.handleSelectedItemChange}/>
      </div>
    );
  }
}

export default App;
