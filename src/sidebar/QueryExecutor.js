import React, {useState} from 'react';
import { motion } from 'framer-motion';
import './ItemViewerComponents.css';
import './QueryExecutor.css';
import {submitQuery} from "./UtilityFunctions";

export default class ExecuteQuerySection extends React.Component {
  static variants = {
    ready: {backgroundColor: '#b3b3b3'},
    loading: {backgroundColor: '#9c9c9c'}
  }

  constructor(props) {
    super(props);
    this.state = {
      query: '',
      result: null,
      queryGenerated: false,
      queryExecuted: false,
      gettingCanvasState: false,
      convertingGraphToSparql: false,
      error: null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { canvasState } = this.props;

    if (prevProps.canvasState.graph !== canvasState.graph){
      this.setState({gettingCanvasState: false, convertingGraphToSparql: true});

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

  getNodeFrag = (node, unknownNodes) => {
    let frag;
    if (node.type === 'nodeUri') {
      frag = "<" + node.iri + ">";
    } else if (node.type === 'nodeSelectedUnknown' || node.type === 'nodeUnknown') {
      frag = unknownNodes[node.id].frag;
    } else {
      frag = node.content;
    }
    return frag;
  }

  getEdgeFrag = (edge, unknownEdges) => {
    let frag;
    if (edge.type === 'edgeUnknown') {
      frag = unknownEdges[edge.id].frag;
    } else {
      frag = `<${edge.iri}>`;
    }
    return frag;
  }

  generateSparqlQueryString = (unknownNodes, unknownEdges) => {
    const selectClause = this.selectClause(unknownNodes, unknownEdges);
    const whereClause = this.whereClause(unknownNodes, unknownEdges);
    const orderingClause = this.orderingClause();

    return `${selectClause}\n${whereClause}\n${orderingClause}`;
  }

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

  orderingClause = () => {
    return '';
  }

  checkRequestCanvasState = () => {
    const { query, gettingCanvasState, convertingGraphToSparql, queryGenerated } = this.state;

    if (queryGenerated) {
      this.setState({queryGenerated: false, queryExecuted: true});

      submitQuery(query).then(
        response => this.setState({result: response}),
        error => this.setState({error: error})
      );
    } else if (!gettingCanvasState && !convertingGraphToSparql) {
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
          <motion.div className={'button'} variants={ExecuteQuerySection.variants} inital={false} animate={animation}
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

function QueryViewerWrapper(props) {
  const { query, result, generated, executed } = props;
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

function QueryViewer(props) {
  return (
    <p className='sparql'>{props.query}</p>
  );
}

function ResultViewer(props) {
  const selectedVars = props.result.head.vars;
  const results = props.result.results.bindings

  return (
    <table className='table-container'>
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
            {Object.keys(result).map((key, ix) =>
              <td key={ix}>{result[key].value}</td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
}

class ErrorMessages {
  static noSelectedUnknowns = "Query failed: There are no nodes selected to display as results. Click on a " +
    "node and then click the 'Show in results' button to have it come up in the query, then try again.";
}