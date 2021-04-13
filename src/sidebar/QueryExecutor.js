import React from 'react';

export default class ExecuteQueryButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: '',
      gettingCanvasState: false,
      errorsExist: false,
      errors: []
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { canvasState } = this.props;
    console.log(`looking for canvasState: ${prevProps.canvasState} ${canvasState}`)

    if (prevProps.canvasState && prevProps.canvasState.id !== canvasState.id){
      console.log(canvasState);
      this.setState({gettingCanvasState: false});
      const errorList = this.findErrorsInCanvasState();

      if (errorList.length !== 0) {
        const sparqlQueryString = this.generateSparqlQueryString();

        this.setState({query: sparqlQueryString, errorsExist: false});
      } else {
        this.setState({errorsExist: true, errors: errorList});
      }
    }
  }

  findErrorsInCanvasState = () => {

  }

  generateSparqlQueryString = () => {
    return `${this.selectClause()}\n${this.whereClause}\n${this.orderingClause}`;
  }

  selectClause = () => {
    const { canvasState } = this.props;
    let selectClauseString = 'SELECT ';

    const selectUnknownNodes = canvasState.nodes.filter(node => node.content.startsWith('?'));
    for (const unknownNode of selectUnknownNodes){
      selectClauseString += `${unknownNode.iri} `;
    }

    return selectClauseString;
  }

  whereClause = () => {

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