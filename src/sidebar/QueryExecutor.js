import React from 'react';

export default class ExecuteQueryButton extends React.Component {
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
        const sparqlQueryString = this.generateSparqlQueryString();

        this.setState({query: sparqlQueryString, errorsExist: false});
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

  generateSparqlQueryString = () => {
    return `${this.selectClause()}\n${this.whereClause()}\n${this.orderingClause()}`;
  }

  selectClause = () => {
    const { canvasState } = this.props;
    let selectClauseString = 'SELECT ';

    const selectUnknownNodes = canvasState.graph.nodes.filter(node => node.content.startsWith('?'));
    const selectUnknownEdges = canvasState.graph.edges.filter(edge => edge.content.startsWith('?'));
    for (const unknownNode of selectUnknownNodes){
      selectClauseString += `${unknownNode.content} `;
    }
    for (const unknownEdge of selectUnknownEdges) {
      selectClauseString += `${unknownEdge.content} `;
    }

    return selectClauseString;
  }

  whereClause = () => {
    const { canvasState } = this.props;
    let whereClauseString = 'WHERE {\n';

    const edges = canvasState.graph.edges;
    const nodes = canvasState.graph.nodes;

    for (const edge of edges) {
      const subject = nodes.find(node => edge.subject.id === node.id);
      const object = nodes.find(node => edge.object.id === node.id);

      whereClauseString += `  ${subject.type === 'nodeUri' ? subject.iri : subject.content} `;
      whereClauseString += `${edge.type === 'edgeKnown' ? edge.iri : edge.content} `;
      whereClauseString += `${object.type === 'nodeUri' ? object.iri : object.content} .\n`;
    }
    whereClauseString += '}\n';

    return whereClauseString;
  }

  orderingClause = () => {

  }

  beginRequestCanvasState = () => {
    this.setState({gettingCanvasState: true});
    this.props.requestCanvasState();
  }

  render() {
    const { gettingCanvasState } = this.state;

    return (
      <>
        <button onClick={this.beginRequestCanvasState} type={'button'}>
          Execute Query
        </button>
        {gettingCanvasState &&
          <div>Loading...</div>
        }
      </>
    );
  }
}