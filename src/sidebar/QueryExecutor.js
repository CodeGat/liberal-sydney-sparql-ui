import React, {useState} from 'react';
import { motion } from 'framer-motion';
import './ItemViewerComponents.css';
import './QueryExecutor.css';
import {submitQuery} from "./UtilityFunctions";

/**
 * Class that represents the ExecuteQuery button and ResultViewer
 */
export default class ExecuteQuerySection extends React.Component {
  // visual variants for the clicked button
  static buttonVariants = {
    ready: {backgroundColor: '#b3b3b3'},
    loading: {backgroundColor: '#9c9c9c'}
  }

  constructor(props) {
    super(props);
    this.state = {
      query: '', // string representation of the valid SPARQL query
      result: null, // object result of execution of the SPARQL query
      queryGenerated: false, // did the graph -> SPARQL query conversion work?
      queryExecuted: false, // did the query execute successfully?
      gettingCanvasState: false, // has the canvas returned the snapshot of the canvas?
      convertingGraphToSparql: false, // is the graph being converted to the valid SPARQL query ?
      error: null // object representation of an error
    };
  }

  /**
   * Given a new Canvas snapshot, attempt conversion from the graph to valid SPARQL
   * @param prevProps - props from the last React state update
   * @param prevState - state from the last React state update
   * @param snapshot  - snapshot of the last React state update
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { canvasState } = this.props;

    if (prevProps.canvasState.graph !== canvasState.graph){ // if there is a new snapshot available, start the conversion
      this.setState({gettingCanvasState: false, convertingGraphToSparql: true});

      // find the SelectedUnknown Nodes/Edges so we know what is SPARQL SELECTed in the query
      const unknownNodes = this.preprocessUnknownNodes();
      const unknownEdges = this.preprocessUnknownEdges();

      let sparqlQueryString;
      try {
        sparqlQueryString = this.generateSparqlQueryString(unknownNodes, unknownEdges);
      } catch (e) {
        this.setState({error: e.message, convertingGraphToSparql: false});
        return;
      }

      this.setState({query: sparqlQueryString, error: null, queryGenerated: true, convertingGraphToSparql: false});
    }
  }

  /**
   * Find all the bound SelectedUnknown nodes
   * @returns {Object} - an object containing the ids of each selected node, and their contents
   */
  preprocessUnknownNodes = () => {
    const { nodes } = this.props.canvasState.graph;

    const processedUnknownNodes = {};

    const selectUnknownNodes = nodes.filter(node => node.type === 'nodeSelectedUnknown' || node.type === 'nodeUnknown');
    for (const node of selectUnknownNodes) {
      if (node.content === '?') {
        processedUnknownNodes[node.id] = {frag: '?node' +node.id, selected: node.type === 'nodeSelectedUnknown'};
      } else {
        processedUnknownNodes[node.id] = {frag: node.content, selected: node.type === 'nodeSelectedUnknown'};
      }
    }

    return processedUnknownNodes;
  }

  /**
   * Find all the bound edgeUnknown edges
   * @returns {Object} - an object containing the ids of each selected edge, and their contents
   */
  preprocessUnknownEdges = () => {
    const { canvasState } = this.props;
    const processedUnknownEdges = {};

    const selectUnknownEdges = canvasState.graph.edges.filter(edge => edge.type === 'edgeUnknown');
    for (const edge of selectUnknownEdges) {
      if (edge.content === '?'){
        processedUnknownEdges[edge.id] = {frag: '?edge' +edge.id, selected: edge.type !== 'edgeUnknown'};
      } else {
        processedUnknownEdges[edge.id] = {frag: edge.content, selected: edge.type !== 'edgeUnknown'};
      }
    }

    return processedUnknownEdges;
  }

  /**
   * Convert the given graph representation of a Node to a SPARQL IRI, literal or variable
   * @param {Object} node - the Graph Node and it's information
   * @param {Object} unknownNodes - contains SELECTed nodes in <id, info> pairs
   * @returns {string} - the equivalent SPARQL-compliant representation of a node
   */
  getNodeFrag = (node, unknownNodes) => {
    let frag;
    if (node.type === 'nodeUri') {
      frag = '<' + node.iri + '>';
    } else if (node.type === 'nodeSelectedUnknown' || node.type === 'nodeUnknown') {
      frag = unknownNodes[node.id].frag;
    } else {
      frag = node.content;
    }
    return frag;
  }

  /**
   * Convert the given graph representation of an Edge to a SPARQL IRI or variable
   * @param {Object} edge - the Graph Edge and its information
   * @param {Object} unknownEdges - contains SELECTed edges in <id, info> pairs
   * @returns {string} - the equivalent SPARQL-compliant representation of an edge
   */
  getEdgeFrag = (edge, unknownEdges) => {
    let frag;
    if (edge.type === 'edgeUnknown') {
      frag = unknownEdges[edge.id].frag;
    } else {
      frag = '<' + edge.iri + '>';
    }
    return frag;
  }

  /**
   * The top-level method for the creation of a SPARQL-compliant string
   * @param {Object} unknownNodes - contains SELECTed nodes in <id, info> pairs
   * @param {Object} unknownEdges - contains SELECTed edges in <id, info> pairs
   * @returns {string} - the SPARQL-compliant string
   */
  generateSparqlQueryString = (unknownNodes, unknownEdges) => {
    const selectClause = this.selectClause(unknownNodes, unknownEdges);
    const whereClause = this.whereClause(unknownNodes, unknownEdges);
    const orderingClause = this.orderingClause();

    return `${selectClause}\n${whereClause}\n${orderingClause}`;
  }

  /**
   * Method for creation of a SELECT clause in a SPARQL compliant string
   * @param {Object} unknownNodes - contains SELECTed nodes in <id, info> pairs
   * @param {Object} unknownEdges - contains SELECTed edges in <id, info> pairs
   * @returns {string} - the SELECT clause
   */
  selectClause = (unknownNodes, unknownEdges) => {
    const selectKeyword = 'SELECT ';
    let selectClauseString = '';


    for (const unknownNode of Object.values(unknownNodes)) {
      if (unknownNode.selected) selectClauseString += `${unknownNode.frag} `;
    }
    for (const unknownEdge of Object.values(unknownEdges)) {
      if (unknownEdge.selected) selectClauseString += `${unknownEdge.frag} `;
    }

    if (selectClauseString !== '') return selectKeyword + selectClauseString;
    else throw new Error(ErrorMessages.noSelectedUnknowns);
  }


  /**
   *  Method for creation of a WHERE clause in a SPARQL compliant string
   * @param {Object} unknownNodes - contains SELECTed nodes in <id, info> pairs
   * @param {Object} unknownEdges - contains SELECTed edges in <id, info> pairs
   * @returns {string} - the WHERE clause
   */
  whereClause = (unknownNodes, unknownEdges) => {
    const { canvasState } = this.props;
    let whereClauseString = 'WHERE {\n';

    const edges = canvasState.graph.edges;
    const nodes = canvasState.graph.nodes;

    for (const edge of edges) {
      const subject = nodes.find(node => edge.subject.id === node.id);
      const subjectFrag = this.getNodeFrag(subject, unknownNodes);

      const edgeFrag = this.getEdgeFrag(edge, unknownEdges);

      const object = nodes.find(node => edge.object.id === node.id);
      const objectFrag = this.getNodeFrag(object, unknownNodes);

      if (edge.isOptional){
        whereClauseString += `  OPTIONAL { ${subjectFrag} ${edgeFrag} ${objectFrag} . }\n`;
      } else {
        whereClauseString += `  ${subjectFrag} ${edgeFrag} ${objectFrag} .\n`;
      }
    }
    whereClauseString += '}\n';

    return whereClauseString;
  }

  /**
   *  Method for creation of a ORDER BY clause in a SPARQL compliant string
   * @returns {string} - the ORDER BY clause
   */
    //todo: stub method for ordering clause
  orderingClause = () => {
    return '';
  }

  /**
   * Method invoked when clicking the Generate/Execute Query button
   */
  checkRequestCanvasState = () => {
    const { query, gettingCanvasState, convertingGraphToSparql, queryGenerated } = this.state;

    if (queryGenerated) { // its then Execute button: use the generated query to get results from the SPARQL endpoint
      this.setState({queryGenerated: false, queryExecuted: true});

      submitQuery(query).then(
        response => this.setState({result: response}),
        error => this.setState({error: error})
      );
    } else if (!gettingCanvasState && !convertingGraphToSparql) { // it's the Generate button: get the canvas snapshot
      this.setState({gettingCanvasState: true, queryGenerated: false, queryExecuted: false});
      this.props.requestCanvasState();
    }
  }

  render() {
    const {
      query, result,
      queryGenerated, queryExecuted,
      gettingCanvasState, convertingGraphToSparql, error
    } = this.state;
    const animation = gettingCanvasState || convertingGraphToSparql ? 'loading' : 'ready';

    return (
      <div>
        <div className={'executequery-wrapper'}>
          <motion.div className={'button'} variants={ExecuteQuerySection.buttonVariants} inital={false} animate={animation}
                      onClick={this.checkRequestCanvasState}>
            <p>{queryGenerated ? 'Execute' : 'Generate'} Query</p>
          </motion.div>
          {gettingCanvasState && <p>Getting Canvas State...</p>}
          {convertingGraphToSparql && <p>Converting Graph to SPARQL...</p>}
          {error && <p className={'small error'}>{error}</p>}
        </div>
        {(queryGenerated || queryExecuted) &&
          <QueryViewerWrapper query={query} result={result} generated={queryGenerated} executed={queryExecuted} />
        }
      </div>

    );
  }
}

/**
 * Wrapper element for the SPARQL query/results container at the bottom of the screen
 * @param {string} query - the generated SPARQL query string, if it exists
 * @param {Object} result - results of running the generated SPARQL query, if they exist
 * @param {boolean} generated - has the query been generated yet?
 * @param {boolean} executed - has the query been executed yet?
 * @returns {JSX.Element} - HTML frag of the Wrapper
 */
function QueryViewerWrapper({query, result, generated, executed}) {
  const [ isOpen, setIsOpen ] = useState(true);
  const toggleViewer = () => setIsOpen(!isOpen);

  return (
    <motion.div className='results-container'
                initial={{height: 0}} animate={{height: isOpen ? 'min-content' : '50px'}}>
      <p className='results-header button' onClick={() => toggleViewer()}>Results Viewer</p>
      {generated && <QueryViewer query={query} />}
      {executed && result && <ResultViewer result={result} />}
    </motion.div>
  );
}

/**
 * <p> representation of the SPARQL query
 * @param {string} query - the SPARQL query to be represented
 * @returns {JSX.Element} - the <p> tag with the query
 */
function QueryViewer({query}) {
  return (
    <p className='sparql'>{query}</p>
  );
}

/**
 * Viewer function for a given SPARQL Result
 * @param {Object} result - the Object representation of the results
 * @returns {JSX.Element} - the table representation of the results
 */
function ResultViewer({result}) {
  const selectedVars = result.head.vars;
  const results = result.results.bindings;

  return (
    <div className='table-container'>
      <table>
        <thead>
          <tr>
            {selectedVars.map((selectedVar, ix) =>
              <th key={ix}>{selectedVar}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((result, ix) =>
            <tr key={ix}>
              {selectedVars.map((key, ix) =>
                <td key={ix}>{result[key].value}</td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Convenient error class for different errors that can arise when converting from the graph to SPARQL representation
 */
class ErrorMessages {
  static noSelectedUnknowns = "Query failed: There are no nodes selected to display as results. Click on a " +
    "node and then click the 'Show in results' button to have it come up in the query, then try again.";
}