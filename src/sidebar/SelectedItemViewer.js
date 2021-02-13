import React from "react";
import './Sidebar.css';
import './SelectedItemViewer.css';
import { fetchExpansionOfPrefix } from "./UtilityFunctions";
import nodeImg from "./node_icon_known.png";
import arrowKnownImg from "./arrow_icon_known_black.png";
import arrowUnknownImg from './arrow_icon_unknown_black.png'
import litImg from "./literal_icon_known.png";
import unkImg from "./node_icon_unknown.png";
import noneImg from "./none_icon.png";

//todo: domain, range, from (in case of ?)
export default class SelectedItemViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedPrefix: '',
      expandedPrefixLoaded: false
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
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
    const { type, content, basePrefix, info, infoLoaded } = this.props;
    const { expandedPrefix, expandedPrefixLoaded } = this.state;

    if (type === "nodeUri") {
      // const [prefix, name] = content.split(/[.#/](?=[^.#/]*$)/); //todo: used for full uris!
      let [prefix, name] = content.split(':');

      if (prefix === '') prefix = basePrefix;
      if (expandedPrefixLoaded) prefix = expandedPrefix;

      return (<SelectedUriNodeViewer type={type} prefix={prefix} name={name} info={info} infoLoaded={infoLoaded} />);
    } else if (type === "nodeUnknown") {
      return (<SelectedUnknownNodeViewer type={type} content={content} />);
    } else if (type === "nodeLiteral") {
      return (<SelectedLiteralNodeViewer type={type} content={content} />);
    } else if (type === "edgeKnown") {
      let [prefix, name] = content.split(':');

      if (prefix === '') prefix = basePrefix;
      if (expandedPrefixLoaded) prefix = expandedPrefix;

      return (<SelectedKnownEdgeViewer type={type} prefix={prefix} name={name} info={info} infoLoaded={infoLoaded} />);
    } else if (type === "edgeUnknown") {
      return(<SelectedUnknownEdgeViewer type={type} content={content} />);
    } else {
      return (<SelectedNullViewer type={type} content={content} />);
    }
  }
}

function SelectedUriNodeViewer(props) {
  const { type, prefix, name, info, infoLoaded } = props;
  //todo: might need to take into account different delimiters such as '.', '#', '/'.
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <SelectedItemViewerDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

function SelectedItemViewerDesc(props) {
  const { desc } = props;

  return (
    <>
      <p className={'grid-desc'}>Desc.</p>
      <p className={'grid-description light small'}>{desc}</p>
    </>
  );
}

function SelectedUnknownNodeViewer(props) {
  const { type, content } = props;
  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={content} />
      <SelectedItemViewerInferredProps />
    </div>
  );
}

function SelectedLiteralNodeViewer(props) {
  const { type, content } = props;

  const name = content.match(/".*".*/) ? content.split(/(?=[^"]*$)/)[0] : content;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerLiteralType content={content} />
    </div>
  );
}

function SelectedUnknownEdgeViewer(props) {
  const { type, content } = props;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} content={content} />
      <SelectedItemViewerInferredProps />
    </div>
  );
}

function SelectedKnownEdgeViewer(props) {
  const { type, prefix, name, info, infoLoaded } = props;
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  console.log(props);

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} name={name} />
      <SelectedItemViewerPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <SelectedItemViewerDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

function SelectedNullViewer(props) {
  const { type } = props;

  return (
    <div className={'itemviewer'}>
      <SelectedItemViewerImageHeader type={type} />
    </div>
  );
}

function SelectedItemViewerImageHeader(props) {
  const { type, name } = props;

  if (type === 'nodeUri') {
    return (
      <>
        <img className={'grid-img'} src={nodeImg} alt={'selected known node icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'edgeKnown') {
    return (
      <>
        <img className={'grid-img'} src={arrowKnownImg} alt={'selected known edge icon'}/>
        <p className={'grid-name'}>{name}</p>
      </>
    );
  } else if (type === 'edgeUnknown') {
    return (
      <>
        <img className={'grid-img'} src={arrowUnknownImg} alt={'selected unknown edge icon'}/>
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

//todo: infer properties based on connections to a ? node
function SelectedItemViewerInferredProps(props) {
  console.log(props);
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
