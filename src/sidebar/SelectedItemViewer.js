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

//todo: remove prefix finding
/**
 * Class for the top area of the Sidebar - displays information about the currently selected item. Wrapper for
 *   type-specific Viewer
 */
export default class SelectedItemViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedPrefix: '', // the expanded version of the prefix of the selected item, usually a URI
      expandedPrefixLoaded: false // check for it the expanded prefix has been loaded
    };
  }

  /**
   * Find the expanded prefix of the currently selected item if it exists
   * @param prevProps - props from the last React state update
   * @param prevState - state from the last React state update
   * @param snapshot  - snapshot of the last React state update
   */
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
    const { id, content, isOptional, meta } = this.props;

    this.props.changeNodeState(id, {type: newType});
    this.props.onSelectedItemChange(newType, id, content, isOptional, meta);
  }

  render() {
    const { id, type, content, isOptional, meta, basePrefix, info, infoLoaded } = this.props;
    const { expandedPrefix, expandedPrefixLoaded } = this.state;

    if (type === "nodeUri" || type === "edgeKnown") { // these types have prefixes, find them and return the Viewer
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
                                         isOptional={isOptional}
                                         info={info} infoLoaded={infoLoaded}
                                         deleteItemCascade={this.props.deleteItemCascade}
                                         setOptionalTriple={this.props.setOptionalTriple} />);
      }
    } else if (type === "nodeUnknown" || type === "nodeSelectedUnknown") { // the rest of these don't require prefix lookup
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

/**
 * Viewer for Uri Nodes when they have been Selected
 * @param {Object} props - required information and functions for displaying the Selected URI.
 * @returns {JSX.Element} - HTML Fragment for Selected URI Viewer
 */
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

/**
 * Viewer for Unknown Nodes when they have been Selected
 * @param {Object} props - required information and functions for displaying the Selected Unknown.
 * @returns {JSX.Element} - HTML Fragment for Selected Unknown Node Viewer
 */
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

/**
 * Viewer for Literal Nodes when they have been Selected
 * @param {Object} props - required information and functions for displaying the Selected Literal.
 * @returns {JSX.Element} - HTML Fragment for Selected Literal Node Viewer
 */
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

/**
 * Viewer for SelectedUnknown Nodes when they have been Selected
 * @param {Object} props - required information and functions for displaying the Selected SelectedUnknown.
 * @returns {JSX.Element} - HTML Fragment for Selected SelectedUnknown Node Viewer
 */
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

/**
 * Viewer for Known Edges when they have been Selected
 * @param {Object} props - required information and functions for displaying the Selected Known Edge.
 * @returns {JSX.Element} - HTML Fragment for Selected Known Edge Viewer
 */
function SelectedKnownEdgeViewer(props) {
  const { id, type, isOptional, prefix, name, info, infoLoaded } = props;
  const selectedUriInfo = info[prefix + '#' + name] ? info[prefix + '#' + name].comment : false;

  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} name={name} />
      <DeleteItemButton deleteItemCascade={() => props.deleteItemCascade(id, type)}/>
      <OptionalTripleButton isOptional={isOptional}
                            toggleOptionalTriple={() => props.setOptionalTriple(id, !isOptional)} />
      <ItemPrefix prefix={prefix} />
      {infoLoaded && selectedUriInfo &&
        <ItemDesc desc={selectedUriInfo} />
      }
    </div>
  );
}

/**
 * Stub class for either errors or initial canvas layout
 * @param {string} type - type of the selected item
 * @returns {JSX.Element} -  HTML Fragment for no selection or error
 * @constructor
 */
function SelectedNullViewer({type}) {
  return (
    <div className={'itemviewer'}>
      <ItemImageHeader type={type} />
    </div>
  );
}