import React from "react";
import './Sidebar.css';
import './SelectedItemViewer.css';
import { fetchExpansionOfPrefix } from "./UtilityFunctions";
import {
  ItemImageHeader,
  ItemPrefix,
  ItemDesc,
  ItemInferredProps,
  ItemLiteralType,
  BoundUnknownCheckbox,
  DeleteItemButton,
  OptionalTripleButton
} from "./ItemViewerComponents";

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

  /**
   * Changes the currently selected element to a new type and updates the currently selected item
   * @param {string} newType - the updated type
   */
  notifySelectedStateChange = (newType) => {
    const { id, content, meta } = this.props;

    this.props.changeNodeState(id, {type: newType});
    this.props.onSelectedItemChange(newType, id, content, meta);
  }

  render() {
    const { id, type, content, basePrefix, info, infoLoaded, meta } = this.props;
    const { expandedPrefix, expandedPrefixLoaded } = this.state;

    if (type === "nodeUri" || type === "edgeKnown") {
      const contentSegments = content.split(':');
      let prefix = 'Unknown';
      let name = contentSegments.length > 1 ? contentSegments[1] : contentSegments[0];

      if (contentSegments[0] === '' || contentSegments.length === 1) prefix = basePrefix;
      if (expandedPrefixLoaded) prefix = expandedPrefix;

      if (type === "nodeUri") {
        return (
          <SelectedUriNodeViewer id={id} type={type} prefix={prefix} name={name} info={info} infoLoaded={infoLoaded}
                                 deleteItemCascade={this.props.deleteItemCascade}/>
        );
      } else {
        return (<SelectedKnownEdgeViewer id={id} type={type} prefix={prefix} name={name}
                                         info={info} infoLoaded={infoLoaded}
                                         deleteItemCascade={this.props.deleteItemCascade}/>);
      }
    } else if (type === "nodeUnknown" || type === "nodeSelectedUnknown") {
      return (
        <SelectedUnknownNodeViewer id={id} type={type} content={content} meta={meta}
                                   onBoundChange={(newType) => this.notifySelectedStateChange(newType)}
                                   deleteItemCascade={this.props.deleteItemCascade}/>
      );
    } else if (type === "nodeLiteral") {
      return (
        <SelectedLiteralNodeViewer id={id} type={type} content={content}
                                   deleteItemCascade={this.props.deleteItemCascade}/>
      );
    } else if (type === "edgeUnknown") {
      return(
        <SelectedUnknownEdgeViewer id={id} type={type} content={content}
                                   deleteItemCascade={this.props.deleteItemCascade}/>
      );
    } else {
      return (<SelectedNullViewer type={type} content={content} />);
    }
  }
}

function SelectedUriNodeViewer(props) {
  const { id, type, prefix, name, info, infoLoaded } = props;
  //todo: might need to take into account different delimiters such as '.', '#', '/'.
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
      <ItemPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <ItemDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

function SelectedUnknownNodeViewer(props) {
  const { id, type, content, meta } = props;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={content} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
      <BoundUnknownCheckbox type={type} onBoundChange={(type) => props.onBoundChange(type)} />
      {meta &&
        <ItemInferredProps meta={meta} />
      }
    </div>
  );
}

function SelectedLiteralNodeViewer(props) {
  const { id, type, content } = props;

  const name = content.match(/".*".*/) ? content.split(/(?=[^"]*$)/)[0] : content;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
      <ItemLiteralType content={content} />
    </div>
  );
}

function SelectedUnknownEdgeViewer(props) {
  const { id, type, content } = props;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} content={content} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
      <ItemInferredProps />
    </div>
  );
}

function SelectedKnownEdgeViewer(props) {
  const { id, type, prefix, name, info, infoLoaded } = props;
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
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