import React from 'react';
import { motion } from 'framer-motion';
import "./Sidebar.css"

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.handleSelectedItemChange = this.handleSelectedItemChange.bind(this);
  }

  handleSelectedItemChange(event){
    this.props.onSelectedItemChange(event.target.value);
  }

  render(){
    const selected = this.props.selected;

    console.log(selected);

    return (
      <div className="sidebar">
        <SelectedItemViewer current={selected}/>
        <SuggestiveSearch current={selected}/>
      </div>
    );
  }
}

function SelectedItemViewer(props) {
  return (
    <div>
      <p>{props.current}</p>
    </div>
  );
}

function SuggestiveSearch(props) {
  return (
    <div>
      <p>{props.current}</p>
    </div>
  );
}
