import React from 'react';
import { motion } from 'framer-motion';
import "./Sidebar.css"

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    return (
      <div className="sidebar">
        {/*<SelectedItemViewer current="None"/>*/}
        {/*<SuggestiveSearch/>*/}
      </div>
    );
  }
}

class SelectedItemViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      label: '',
      image: '',
      description: {}
    }
  }

  render(){
    return (
      <div>

      </div>
    );
  }
}

class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {selectedItem: {}};
  }

  render(){
    return (
      <div>

      </div>
    );
  }
}
