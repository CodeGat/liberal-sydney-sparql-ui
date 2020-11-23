import React from 'react';
import logo from './logo.svg';
import './App.css';
import Canvas from "./Canvas";
import SideBar from "./SideBar";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selected: ''};
    this.handleSelectedItemChange = this.handleSelectedItemChange.bind(this);
  }

  handleSelectedItemChange(item){
    this.setState({selected: item});
  }

  render(){
    const selected = this.state.selected;

    return (
      <div className="App">
        <Canvas selected={selected} onSelectedItemChange={this.handleSelectedItemChange}/>
        <SideBar selected={selected} onSelectedItemChange={this.handleSelectedItemChange}/>
      </div>
    );
  }
}

export default App;
