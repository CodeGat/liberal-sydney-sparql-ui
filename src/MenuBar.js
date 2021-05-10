import React from "react";
import './MenuBar.css';

export default class MenuBar extends React.Component {
  /**
   *
   * @param {number} i - index of example to load
   */
  loadExample = (i) => {
    fetch('examples.json', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(
      response => response.json().then(
        json => this.props.loadExampleIntoCanvas(json.examples[i]),
        error => console.warn("JSON is malformed", error)),
      error => console.warn("Couldn't get the local .json examples:", error)
    );
  };

  render() {
    return (
      <div className='navbar navbar-default navbar-fixed-top'>
        <div className='nav-header'>
          <p className='nav-header-text'>LMB SPARQL Explorer</p>
        </div>
        <ul className='nav'>
          <li className='nav-item'>
            <a className='nav-item-text' href='https://lmb.cdhr.anu.edu.au/'>Return to LMB Main</a>
          </li>
          {/*<li className='nav-item'>*/}
          {/*  <p className='nav-item-text' onClick={() => this.loadExample(2)}>Load Example 3</p>*/}
          {/*</li>*/}
          {/*<li className='nav-item'>*/}
          {/*  <p className='nav-item-text' onClick={() => this.loadExample(1)}>Load Example 2</p>*/}
          {/*</li>*/}
          <li className='nav-item'>
            <p className='nav-item-text' onClick={() => this.loadExample(0)}>Load Example 1</p>
          </li>
        </ul>
      </div>
    );
  }
}