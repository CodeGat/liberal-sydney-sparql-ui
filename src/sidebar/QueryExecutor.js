import React from 'react';
import { motion } from 'framer-motion';
import './ItemViewerComponents.css';
import './QueryExecutor.css';
import {submitQuery} from "./UtilityFunctions";

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
      error: null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { canvasState } = this.props;

    if (prevProps.canvasState.graph !== canvasState.graph){
      this.setState({gettingCanvasState: false, convertingGraphToSparql: true});

      const unknownNodes = this.preprocessUnknownNodes();
      const unknownEdges = this.preprocessUnknownEdges();

      const sparqlQueryString = this.generateSparqlQueryString(unknownNodes, unknownEdges);

      submitQuery(sparqlQueryString).then(
        response => console.log(response.results.bindings),
        error => console.warn(error)
      )

      this.setState({query: sparqlQueryString, error: null, convertingGraphToSparql: false});
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

    console.log(selectClause + whereClause);

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

    if (selectClauseString !== '') {
      return selectKeyword + selectClauseString;
    } else {
      this.setState({error: ErrorMessages.noSelectedUnknowns});
      return;
    }
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
    const { gettingCanvasState, convertingGraphToSparql, error } = this.state;
    const animation = gettingCanvasState || convertingGraphToSparql ? 'loading' : 'ready';

    return (
      <div className={'executequery-wrapper'}>
        <motion.div className={'button'} variants={ExecuteQueryButton.variants} inital={false} animate={animation}
                    onClick={this.checkRequestCanvasState}>
          <p>Execute Query</p>
        </motion.div>
        {gettingCanvasState && <p>Getting Canvas State...</p>}
        {convertingGraphToSparql && <p>Converting Graph to SPARQL...</p>}
        {error && <p className={'small error'}>{error}</p>}
      </div>
    );
  }
}

class ErrorMessages {
  static noSelectedUnknowns = ""
}