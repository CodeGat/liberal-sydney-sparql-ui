import React from 'react';
import { motion } from 'framer-motion';
import './ItemViewerComponents.css';

export default class ExecuteQueryButton extends React.Component {
  static variants = {
    ready: {backgroundColor: '#b3b3b3'},
    loading: {backgroundColor: '#9c9c9c'}
  }

  constructor(props) {
    super(props);
    this.state = {
      query: '',
      gettingCanvasState: false,
      convertingGraphToSparql: false,
      errorsExist: false,
      errors: []
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { canvasState } = this.props;

    if (prevProps.canvasState.graph !== canvasState.graph){
      this.setState({gettingCanvasState: false, convertingGraphToSparql: true});
      const errorList = this.findErrorsInCanvasState();

      if (errorList.length === 0) {
        const preprocessedUnknownNodes = this.preprocessUnknownNodes();
        const preprocessedUnknownEdges = this.preprocessUnknownEdges();

        const sparqlQueryString = this.generateSparqlQueryString(preprocessedUnknownNodes, preprocessedUnknownEdges);

        this.setState({query: sparqlQueryString, errorsExist: false, convertingGraphToSparql: false});
      } else {
        this.setState({errorsExist: true, errors: errorList});
      }
    }
  }

  /**
   * Looks through the graph for any glaring errors.
   * @returns {String[]} - errors encountered in the graph patterns
   */
  findErrorsInCanvasState = () => {
    const errors = [];


    return errors;
  }

  preprocessUnknownNodes = () => {
    const { canvasState } = this.props;
    const processedUnknownNodes = {};

    const selectUnknownNodes = canvasState.graph.nodes.filter(node => node.type === 'nodeSelectedUnknown');
    for (const unknownNode of selectUnknownNodes) {
      if (unknownNode.content === '?'){
        processedUnknownNodes[unknownNode.id] = '?node' + unknownNode.id;
      } else {
        processedUnknownNodes[unknownNode.id] = unknownNode.content;
      }
    }

    return processedUnknownNodes;
  }

  preprocessUnknownEdges = () => {
    const { canvasState } = this.props;
    const processedUnknownEdges = {};

    const selectUnknownEdges = canvasState.graph.edges.filter(edge => edge.type === 'edgeUnknown');
    for (const unknownEdge of selectUnknownEdges) {
      if (unknownEdge.content === '?'){
        processedUnknownEdges[unknownEdge.id] = '?edge' + unknownEdge.id;
      } else {
        processedUnknownEdges[unknownEdge.id] = unknownEdge.content;
      }
    }

    return processedUnknownEdges;
  }

  getNodeFrag = (subject, unknownNodes) => {
    let frag;
    if (subject.type === 'nodeUri') {
      frag = subject.iri;
    } else if (subject.type === 'nodeSelectedUnknown') {
      frag = unknownNodes[subject.id];
    } else {
      frag = subject.content;
    }
    return frag;
  }

  generateSparqlQueryString = (unknownNodes, unknownEdges) => {
    const selectClause = this.selectClause(unknownNodes, unknownEdges);
    const whereClause = this.whereClause(unknownNodes, unknownEdges);
    const orderingClause = this.orderingClause();

    console.log(selectClause + whereClause);

    return `${selectClause}\n${whereClause}\n${orderingClause}`;
  }

  selectClause = (unknownNodes, unknownEdges) => {
    let selectClauseString = 'SELECT ';

    for (const unknownNode of Object.values(unknownNodes)) {
      selectClauseString += `${unknownNode} `;
    }
    for (const unknownEdge of Object.values(unknownEdges)) {
      selectClauseString += `${unknownEdge} `;
    }

    return selectClauseString;
  }

  whereClause = (unknownNodes, unknownEdges) => {
    const { canvasState } = this.props;
    let whereClauseString = 'WHERE {\n';

    const edges = canvasState.graph.edges;
    const nodes = canvasState.graph.nodes;

    for (const edge of edges) {
      const subject = nodes.find(node => edge.subject.id === node.id);
      const subjectFrag = this.getNodeFrag(subject, unknownNodes);

      const edgeFrag = edge.type === 'edgeKnown' ? edge.iri : edge.content;

      const object = nodes.find(node => edge.object.id === node.id);
      const objectFrag = this.getNodeFrag(object, unknownNodes);

      whereClauseString += `  ${subjectFrag} ${edgeFrag} ${objectFrag} .\n`;
    }
    whereClauseString += '}\n';

    return whereClauseString;
  }

  orderingClause = () => {
    return '';
  }

  checkRequestCanvasState = () => {
    const { gettingCanvasState, convertingGraphToSparql } = this.state;

    if (!gettingCanvasState && !convertingGraphToSparql) {
      this.setState({gettingCanvasState: true});
      this.props.requestCanvasState();
    }
  }

  render() {
    const { gettingCanvasState, convertingGraphToSparql, query } = this.state;
    const animation = gettingCanvasState || convertingGraphToSparql ? 'loading' : 'ready';

    return (
      <>
        <motion.div className={'button'} variants={ExecuteQueryButton.variants} inital={false} animate={animation}
                    onClick={this.checkRequestCanvasState}>
          <p>Execute Query</p>
        </motion.div>
        {gettingCanvasState && <div>Getting Canvas State...</div>}
        {convertingGraphToSparql && <div>Converting Graph to SPARQL...</div>}
        {query !== '' && <p>{query}</p>}
      </>
    );
  }
}