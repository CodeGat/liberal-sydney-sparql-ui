import React from "react";
import './Sidebar.css';
import './SelectedItemViewer.css';
import { fetchExpansionOfPrefix } from "./UtilityFunctions";
import { ItemImageHeader, ItemPrefix, ItemDesc, ItemInferredProps, ItemLiteralType } from "./ItemViewerComponents";

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
              console.warn("An error occurred during connection to the prefix server: " + error)
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
      <ItemImageHeader type={type} name={name} />
      <ItemPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <ItemDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

function SelectedUnknownNodeViewer(props) {
  const { type, content } = props;
  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={content} />
      <ItemInferredProps />
    </div>
  );
}

function SelectedLiteralNodeViewer(props) {
  const { type, content } = props;

  const name = content.match(/".*".*/) ? content.split(/(?=[^"]*$)/)[0] : content;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <ItemLiteralType content={content} />
    </div>
  );
}

function SelectedUnknownEdgeViewer(props) {
  const { type, content } = props;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} content={content} />
      <ItemInferredProps />
    </div>
  );
}

function SelectedKnownEdgeViewer(props) {
  const { type, prefix, name, info, infoLoaded } = props;
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <ItemPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <ItemDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

function SelectedNullViewer(props) {
  const { type } = props;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} />
    </div>
  );
}