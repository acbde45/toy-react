import ToyReact from "./ToyReact";

class Square extends ToyReact.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
    };
  }

  componentWillMount() {
    console.log("[Square]:componentWillMount");
  }

  componentDidMount() {
    console.log("[Square]:componentDidMount");
  }

  componentWillUpdate() {
    console.log("[Square]:componentWillUpdate");
  }

  componentDidUpdate() {
    console.log("[Square]:componentDidUpdate");
  }

  componentWillReceiveProps(oldState, newState) {
    console.log("[Square]:componentWillReceiveProps", oldState, newState);
  }

  shouldComponentUpdate(oldState, newState) {
    console.log("[Square]:shouldComponentUpdate", oldState, newState);
    return oldState.value !== newState.value;
  }

  render() {
    return (
      <button className="square" onClick={() => this.setState({ value: "X" })}>
        {this.state.value || this.props.value}
      </button>
    );
  }
}

class Board extends ToyReact.Component {
  renderSquare(i) {
    return <Square value={i} />;
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

const App = <Board />;

ToyReact.render(App, document.getElementById("root"));
