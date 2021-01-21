import React from 'react';
import {AnimateSharedLayout, motion} from 'framer-motion';
import "./Sidebar.css"

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {selected: props.content}
  }

  handleSelectedItemChange(event){
    this.props.onSelectedItemChange(event.target.value);
  }

  render(){
    const selected = this.props.selected;

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

class SuggestiveSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {suggestions: []};
  }

  render(){
    const { suggestions } = this.state;

    return (
      <div>
        <AnimateSharedLayout>
          <motion.ul layout>
            {suggestions.map((suggestion, ix) => <Suggestion key={ix} label={} description={} type={} domain={} range={} />)}
          </motion.ul>
        </AnimateSharedLayout>
      </div>
    );
  }
}

function Suggestion(props) {
  const { label, description, type, domain, range } = props;

  return (
    <motion.div>

    </motion.div>
  );
}