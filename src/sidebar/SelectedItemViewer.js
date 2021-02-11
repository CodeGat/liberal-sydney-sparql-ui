import React from "react";
import './Sidebar.css';
import './SelectedItemViewer.css';
import { fetchExpansionOfPrefix } from "./UtilityFunctions";
import nodeImg from "./node_icon_known.png";
import arrowImg from "./arrow_icon_black.png";
import litImg from "./literal_icon_known.png";
import unkImg from "./node_icon_unknown.png";
import noneImg from "./none_icon.png";

//todo: desc, domain, range, from (in case of ?)
export default class SelectedItemViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedPrefix: '',
      expandedPrefixLoaded: false
    };
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {
    const { content } = this.props;

    if (prevProps.content !== content) {
      const [ prefix ] = content.split(':');

      if (prefix !== '') {
        fetchExpansionOfPrefix(prefix)
          .then(
            result =>
              this.setState({
               expandedPrefixLoaded: true,
               expandedPrefix: result.success ? result.value : prefix}),
            error =>
              console.log("An error occurred during connection to the prefix server: " + error)
          );
      }
    }
  }

  render() {
    const { type, content, basePrefix } = this.props;
    const { expandedPrefix, expandedPrefixLoaded } = this.state;

    if (type === "uri") {
      // const [prefix, name] = content.split(/[.#/](?=[^.#/]*$)/); //todo: used for full uris!
      let [prefix, name] = content.split(':');

      if (prefix === '') prefix = basePrefix;
      if (expandedPrefixLoaded) prefix = expandedPrefix;

      return (<SelectedUriItemViewer type={type} prefix={prefix} name={name}/>);
    } else if (type === "unknown") {
      return (<SelectedUnknownItemViewer type={type} content={content} />);
    } else if (type === "literal") {
      return (<SelectedLiteralItemViewer type={type} content={content} />);
    } else if (type === "edge") {
      return (<SelectedEdgeItemViewer type={type} content={content} />); //todo: doesn't include distinction between ? and uri edges! look in edge
    } else {
      return (<SelectedNullItemViewer type={type} content={content} />);
    }
  }
}

function SelectedUriItemViewer(props) {
  const { type, prefix, name } = props;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerPrefix prefix={prefix} />
    </div>
  );
}

function SelectedUnknownItemViewer(props) {
  const { type, content } = props;
  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={content} />
      <SelectedItemViewerInferredProps />
    </div>
  );
}

function SelectedLiteralItemViewer(props) {
  const { type, content } = props;

  const name = content.match(/".*".*/) ? content.split(/(?=[^"]*$)/)[0] : content;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerLiteralType content={content} />
    </div>
  );
}

//todo: remember about the case of ? edges!
function SelectedEdgeItemViewer(props) {
  const { type, content } = props;
  const [name, prefix] = content.split(":");

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerPrefix prefix={prefix} />
    </div>
  );
}

function SelectedNullItemViewer(props) {
  const { type } = props;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} />
    </div>
  );
}

function SelectedItemViewerImageHeader(props) {
  const { type, name } = props;

  if (type === 'uri') {
    return (
      <>
        <img className={'grid-img'} src={nodeImg} alt={'selected known node icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'edge') {
    return (
      <>
        <img className={'grid-img'} src={arrowImg} alt={'selected known edge icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'literal') {
    return (
      <>
        <img className={'grid-img'} src={litImg} alt={'selected known literal icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'unknown') {
    return (
      <>
        <img className={'grid-img'} src={unkImg} alt={'selected unknown node icon'} />
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else {
    console.log("Unknown type: " + type);

    return (
      <>
        <img className={"grid-img"} src={noneImg} alt={'unknown type icon'} />
        <p className={'grid-name'}>{type === '' ? 'Nothing is currently selected' : 'Unknown selected item'}</p>
      </>
    );
  }
}

function SelectedItemViewerPrefix(props) {
  const { prefix } = props;

  return (
    <>
      <p className={'grid-from'}>From</p>
      <p className={'grid-prefix light small'}>{prefix}</p>
    </>
  );
}

function SelectedItemViewerInferredProps(props) {
  return null;
}

function SelectedItemViewerLiteralType(props) {
  const { content } = props;
  let type;

  if (content.match(/".*".*/)) {
    type = "text";
  } else if (content.match(/true|false/)) {
    type = "boolean";
  } else if (content.match(/[+-]?\d+/)) {
    type = "integer";
  } else if (content.match(/[+-]?\d*\.\d+|[+-]?(\d+\.\d*[eE][+-]?\d+|\d+[eE][+-]?\d+)/)) {
    type = "floating point";
  }

  return (
    <>
      <p>Type</p>
      <p>{type}</p>
    </>
  );
}
