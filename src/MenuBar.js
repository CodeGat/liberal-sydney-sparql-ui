import React, {useState} from "react";
import {motion} from "framer-motion";
import './MenuBar.css';

export default function MenuBar() {
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
      {!isHelpPage && <NavBar toggleHelpPage={() => setIsHelpPage(!isHelpPage)} />}
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
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed fringilla a purus quis pellentesque. Fusce id ex hendrerit, elementum elit sed, mollis diam. In pellentesque commodo mi a finibus. Duis dapibus, arcu rutrum sodales gravida, nulla elit congue augue, eget convallis lorem augue ut quam. Morbi et iaculis lacus, sed cursus magna. Aliquam volutpat est tellus, sed tincidunt nisi ultrices ut. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec sit amet velit ex. Sed malesuada arcu sit amet lectus interdum, sit amet aliquet ante blandit. Nullam sollicitudin ac metus in auctor. Maecenas ac volutpat mauris.</p>
      <p>Pellentesque et feugiat enim. Suspendisse accumsan purus eu leo molestie interdum. Fusce at magna ac ex tempus volutpat. Proin tristique semper justo ac ornare. Sed ullamcorper faucibus velit, ac euismod enim molestie non. Praesent et bibendum turpis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur odio purus, consectetur vitae massa at, sodales viverra erat. Sed tempor, sapien ac dignissim finibus, arcu diam vehicula purus, nec tristique mi dolor in libero. Maecenas volutpat erat vel eros mattis malesuada. Morbi feugiat auctor congue. Ut consectetur ultrices tristique. Mauris eget purus in sem efficitur porttitor. Donec imperdiet vitae ipsum in elementum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
      <p>Quisque bibendum nisi quis ipsum ullamcorper interdum. Aliquam consectetur a orci eget aliquet. Maecenas nec dolor id nibh bibendum varius at et justo. Donec volutpat turpis non quam tincidunt vehicula. Donec nisi est, egestas eu consequat id, accumsan sit amet quam. Nullam et ex non massa cursus sagittis. Mauris in eleifend diam. Donec quis ultricies mi. Nulla elementum consequat volutpat. Nam feugiat arcu egestas, gravida ex id, efficitur velit. Suspendisse massa tortor, feugiat vel suscipit vel, luctus tristique risus. Nulla convallis sodales ipsum, a interdum nisi finibus a. Maecenas id faucibus quam. Sed sodales, ante pellentesque tempor posuere, justo turpis scelerisque ligula, vitae ultricies nulla lacus vitae sapien</p>
      <p>Pellentesque facilisis aliquet sapien, facilisis congue lectus eleifend eu. Nulla in molestie mauris, ut tempus velit. Aenean auctor nunc non arcu dignissim, ut dapibus arcu venenatis. Maecenas eget elit in risus facilisis vulputate. Nullam semper lorem eu venenatis pretium. Donec efficitur massa tempor, condimentum purus ut, suscipit nulla. Cras in neque non ex facilisis euismod. Praesent pulvinar diam ut imperdiet dignissim. Aenean ullamcorper, lacus in tempus ornare, nunc ligula efficitur neque, vitae tempus metus turpis sed felis. </p>
      <p>Fusce finibus vel eros eget tempor. Phasellus eu tortor malesuada, consequat nisl non, sodales enim. Sed dolor felis, aliquam at luctus in, euismod id erat. Duis pretium vitae augue sit amet efficitur. Mauris dictum, elit et scelerisque blandit, odio tellus aliquet ex, in tincidunt ipsum purus sit amet ante. Quisque lorem dolor, luctus faucibus neque eu, bibendum venenatis tellus. Integer nec sollicitudin nunc. Nam tincidunt, leo a ultrices mattis, arcu elit eleifend lacus, luctus elementum dui orci ac felis. Quisque eu lorem id mi accumsan eleifend. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque lobortis massa non dapibus molestie. </p>
      <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed fringilla a purus quis pellentesque. Fusce id ex hendrerit, elementum elit sed, mollis diam. In pellentesque commodo mi a finibus. Duis dapibus, arcu rutrum sodales gravida, nulla elit congue augue, eget convallis lorem augue ut quam. Morbi et iaculis lacus, sed cursus magna. Aliquam volutpat est tellus, sed tincidunt nisi ultrices ut. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec sit amet velit ex. Sed malesuada arcu sit amet lectus interdum, sit amet aliquet ante blandit. Nullam sollicitudin ac metus in auctor. Maecenas ac volutpat mauris.</p>
      <p>Pellentesque et feugiat enim. Suspendisse accumsan purus eu leo molestie interdum. Fusce at magna ac ex tempus volutpat. Proin tristique semper justo ac ornare. Sed ullamcorper faucibus velit, ac euismod enim molestie non. Praesent et bibendum turpis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur odio purus, consectetur vitae massa at, sodales viverra erat. Sed tempor, sapien ac dignissim finibus, arcu diam vehicula purus, nec tristique mi dolor in libero. Maecenas volutpat erat vel eros mattis malesuada. Morbi feugiat auctor congue. Ut consectetur ultrices tristique. Mauris eget purus in sem efficitur porttitor. Donec imperdiet vitae ipsum in elementum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.</p>
    </div>
  );
}