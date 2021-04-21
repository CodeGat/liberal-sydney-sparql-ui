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
    const { type, content } = this.props;

    if (prevProps.content !== content && type !== 'nodeLiteral') {
      const contentSegments = content.split(':');

      if (contentSegments.length > 1 && contentSegments[0] !== '') {
        fetchExpansionOfPrefix(contentSegments[0])
          .then(
            result =>
              this.setState({
               expandedPrefixLoaded: true,
               expandedPrefix: result.success ? result.value : contentSegments[0]}),
            error =>
              console.warn("An error occurred during connection to the prefix server: " + error)
          );
      }
    }
  }

  render() {
    const { type, content, basePrefix, info, infoLoaded, meta } = this.props;
    const { expandedPrefix, expandedPrefixLoaded } = this.state;

    if (type === "nodeUri" || type === "edgeKnown") {
      const contentSegments = content.split(':');
      let prefix = 'Unknown';
      let name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];

      if (contentSegments[0] === '' || contentSegments.length === 1) prefix = basePrefix;
      if (expandedPrefixLoaded) prefix = expandedPrefix;

      if (type === "nodeUri") {
        return (<SelectedUriNodeViewer type={type} prefix={prefix} name={name} info={info} infoLoaded={infoLoaded}/>);
      } else {
        return (<SelectedKnownEdgeViewer type={type} prefix={prefix} name={name} info={info} infoLoaded={infoLoaded} />);
      }
    } else if (type === "nodeUnknown") {
      return (<SelectedUnknownNodeViewer type={type} content={content} meta={meta} />);
    } else if (type === "nodeLiteral") {
      return (<SelectedLiteralNodeViewer type={type} content={content} />);
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
  const { type, content, meta } = props;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={content} />
      {meta &&
        <ItemInferredProps meta={meta} />
      }
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