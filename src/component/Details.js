import React, { Component } from "react";


export default class Details extends Component {
  render() {
    console.log(this.props); // Les paramètres d'URL sont maintenant disponibles dans this.props
    const { name } = this.props; // Récupérer le paramètre name
    return <div>Details page: {name}</div>;
  }
}