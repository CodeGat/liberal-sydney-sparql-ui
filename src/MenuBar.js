import React, {useState} from "react";
import {motion} from "framer-motion";
import uri from './img/uri.png';
import unknown from './img/unknown.png';
import selectedunknown from './img/selectedunknown.png';
import literal from './img/literal.png';
import property from './img/property.png';
import './MenuBar.css';

export default function MenuBar(props) {
  const [isHelpPage, setIsHelpPage] = useState(false);
  const menuVaraints = {
    menubar: {
      height: '50px',
      borderRadius: '4px',
      overflowY: 'hidden',
      backgroundColor: '#3e3f3a'
    },
    helpbar: {
      height: '90%',
      borderRadius: '15px',
      overflowY: 'auto',
      backgroundColor: '#d6d6d6'
    }
  };

  return (
    <motion.div className='navbar navbar-default navbar-fixed-top'
                variants={menuVaraints} initial={false} animate={isHelpPage ? 'helpbar' : 'menubar'}
                transition={{bounce: 0.15}}>
      <div className='nav-header'>
        <p className='nav-header-text'>LMB SPARQL Explorer</p>
      </div>
      {!isHelpPage && <NavBar loadExampleIntoCanvas={(example) => props.loadExampleIntoCanvas(example)}
                              toggleHelpPage={() => setIsHelpPage(!isHelpPage)} />}
      {isHelpPage && <HelpPage toggleHelpPage={() => setIsHelpPage(!isHelpPage)} />}
    </motion.div>
  );
}

function NavBar(props) {
  const loadExample = (i) => {
    fetch('examples.json', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).then(
      response => response.json().then(
        json => props.loadExampleIntoCanvas(json.examples[i]),
        error => console.warn("JSON is malformed", error)),
      error => console.warn("Couldn't get the local .json examples:", error)
    );
  };

  return (
    <ul className='nav'>
      <li className='nav-item'>
        <a className='nav-item-text' href='https://lmb.cdhr.anu.edu.au/'>Return to LMB Main</a>
      </li>
      <li className='nav-item'>
        <p className='nav-item-text' onClick={() => props.toggleHelpPage()}>Help</p>
      </li>
      <li className='nav-item'>
        <p className='nav-item-text' onClick={() => loadExample(2)}>Load Example 3</p>
      </li>
      <li className='nav-item'>
        <p className='nav-item-text' onClick={() => loadExample(1)}>Load Example 2</p>
      </li>
      <li className='nav-item'>
        <p className='nav-item-text' onClick={() => loadExample(0)}>Load Example 1</p>
      </li>
    </ul>
  );
}

function HelpPage(props) {

  return (
    <div id='help-page-container' onClick={() => props.toggleHelpPage()}>
      <p>The LMB SPARQL Explorer is a UI that aids the creation of vaild, complete SPARQL Queries that does not require prior knowledge of the syntax of SPARQL.</p>
      <p>It aids the creation of SPARQL queries based on a given ontology and its associated data, through inferring logical connections between the ontology and the instance-level data, through a graph-like structure.</p>
      <p>In order to create some valid queries, there are some basic, fundamental building blocks that the LMB SPARQL Explorer uses, namely:</p>
      <table className='centered-table'>
        <tr>
          <td>
            <img src={unknown} width={150} alt='Unknown Example'/>
          </td>
          <td>
            <img src={selectedunknown} width={150} alt='Selected Unknown Example'/>
          </td>
          <td>
            <img src={uri} width={150} alt='Uri Example'/>
          </td>
          <td>
            <img src={literal} width={150} alt='Literal Example'/>
          </td>
          <td>
            <img src={property} width={150} alt='Property Example'/>
          </td>
        </tr>
        <tr>
          <td className='big text'>Unknown</td>
          <td className='big text'>Selected Unknown</td>
          <td className='big text'>URI</td>
          <td className='big text'>Literal</td>
          <td className='big text'>Property</td>
        </tr>
        <tr>
          <td>
            <p className='text'>Think of it as a wildcard - some 'thing' that is matched against everything in the dataset</p>
          </td>
          <td>
            <p className='text'>This is similar, except we want this 'thing' to be in our results</p>
          </td>
          <td>
            <p className='text'>A URI is a concrete concept, something specific in the data</p>
          </td>
          <td>
            <p className='text'>This is a primitive type - like a string of characters ("Hello!"), numbers (12, 42.0) or others as defined in the ontology</p>
          </td>
          <td>
            <p className='text'>This connects each of the other nodes together. Like the URI, this is also a concrete concept</p>
          </td>
        </tr>
      </table>
      <hr/>
      <p>There are also properties lines in between these </p>
    </div>
  );
}