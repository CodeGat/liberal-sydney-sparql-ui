import './MenuBar.css';

export default function MenuBar(props) {

  return (
    <div className='navbar navbar-default navbar-fixed-top'>
      <div className='nav-header'>
        <p className='nav-header-text'>LMB SPARQL Explorer</p>
      </div>
      <ul className='nav'>
        <li className='nav-item'>
          <a className='nav-item-text' href='https://lmb.cdhr.anu.edu.au/'>Return to LMB Main</a>
        </li>
        <li className='nav-item'>
          <p className='nav-item-text'>Load Examples</p>
        </li>
      </ul>
    </div>
  );
}