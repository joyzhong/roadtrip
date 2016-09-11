import AppBar from 'material-ui/AppBar';
import {List, ListItem} from 'material-ui/List';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import React from 'react';
import ReactDOM from 'react-dom';
import Slider from 'material-ui/Slider';
import Subheader from 'material-ui/Subheader';
import TextField from 'material-ui/TextField';
import injectTapEventPlugin from 'react-tap-event-plugin';
 
// Needed for onTouchTap 
// http://stackoverflow.com/a/34015469/988941 
injectTapEventPlugin();

const TEXT_FIELD_START_DEST = 'textFieldStartDest';
const TEXT_FIELD_FINAL_DEST = 'textFieldFinalDest';
const TEXT_FIELD_TERM = 'textFieldTerm';

const App = () => (
  <MuiThemeProvider>
    <RoadtripComponent />
  </MuiThemeProvider>
);


const RoadtripComponent = React.createClass({
  getInitialState: function() {
    return {
      origin: '',
      destination: '',
      term: '',
      results: [],
    }
  },

  handleChange_: function(data) {
    this.setState(data);
  },

  /** Updates the map with the current origin and destination state. */
  updateMap_: function() {
    const request = {
      origin: this.state.origin,
      destination: this.state.destination,
      travelMode: 'DRIVING'
    };
    const displayDirectionsFn = function(result, status) {
      if (status == 'OK') {
        const pathCoordinates = result.routes[0].overview_path;
        const stopCooordinates = pathCoordinates[Math.round(pathCoordinates.length / 2)];
        directionsDisplay.setDirections(result);
        this.getStopsListFromYelp_(stopCooordinates.lat(), stopCooordinates.lng());
      }
      // TODO: Handle error statuses.
    }.bind(this);

    directionsService.route(request, displayDirectionsFn);
  },

  getStopsListFromYelp_: function(latitude, longitude) {
    $.ajax({
      context: this,
      type: 'POST',
      url: '/yelp', 
      data: { term: this.state.term, latitude: latitude, longitude: longitude },
      success: function(yelpResults) {
        console.log(yelpResults.businesses);
        this.setState({results: yelpResults.businesses});
      }
    });
  },

  render: function() {
    return (
      <div className="container">
        <AppBar title="Roadtrip" />
        <div className="content">
          <div className="form-map-container">
            <FormComponent onSubmit={this.updateMap_} onChange={this.handleChange_} />
            <MapComponent origin={this.state.origin} destination={this.state.destination} />
          </div>
          <ResultsComponent results={this.state.results} />
        </div>
      </div>
    );
  }
});


const FormComponent = React.createClass({
  // TODO: Refactor, DRY!
  handleOriginChange_: function(e) {
    this.props.onChange({origin: e.target.value});
  },

  handleOriginKeyDown_: function(e) {
    if (e.keyCode == 13 /* Enter */) {
      this.props.onChange({origin: e.target.value});
    }
  },

  handleDestinationChange_: function(e) {
    this.props.onChange({destination: e.target.value});
  },

  handleDestinationKeyDown_: function(e) {
    if (e.keyCode == 13 /* Enter */) {
      this.props.onChange({destination: e.target.value});
    }
  },

  handleTermChange_: function(e) {
    this.props.onChange({term: e.target.value});
  },

  handleClick_: function() {
    this.props.onSubmit();
  },

  render: function() {
    return (
      <form className="form-container">
        <FormTextField floatingLabelText="Start Location" id={TEXT_FIELD_START_DEST}
            onChange={this.handleOriginChange_} onKeyDown={this.handleOriginKeyDown_} />
        <FormTextField floatingLabelText="Final Destination" id={TEXT_FIELD_FINAL_DEST}
            onChange={this.handleDestinationChange_} onKeyDown={this.handleDestinationKeyDown_} />
        <FormTextField floatingLabelText="Stop for (e.g. lunch, coffee)..." id='Term'
            onChange={this.handleTermChange_} />

        <FormSlider startValue="0" endValue="2h" />
        <FormSlider startValue="Quality" endValue="Distance" /> 

        <RaisedButton label="Go" primary={true} className="submit-button" onClick={this.handleClick_} />
      </form>
    );
  }
});


/** Text field with customized styling. */
const FormTextField = (props) => (
  <TextField floatingLabelText={props.floatingLabelText} placeholder="" id={props.id}
      style={{ display: 'block', width: '100%' }} onKeyDown={props.onKeyDown} onChange={props.onChange} />
);


/** Slider with customized styling. */
const FormSlider = (props) => (
  <div className="slider-container">
    <span>{props.startValue}</span>
    <Slider value={0.5} style={{ width: '100%', margin: '0 8px' }} 
        sliderStyle={{ marginTop: '18px', marginBottom: '24px' }} />
    <span>{props.endValue}</span>
  </div>
);


const ResultsComponent = (props) => (
  <div className="results-container">
    <List>
      <Subheader>Results</Subheader>
      {
        props.results.map((result) => {
          return <ResultItem key={result.id} result={result} />;
        })
      }
    </List>
  </div>
);


const ResultItem = (props) => (
  <ListItem>
    <div className="result-item">
      {props.result.name}
    </div>
  </ListItem>
);


const MapComponent = () => (
  <div className="map-container">
    <div className="map-iframe-container" id="map">
      // Map is inserted here.
    </div>
  </div>
);


// TODO: Refactor map stuff into new file?
let autocompleteStartDest;
let autocompleteFinalDest;

let directionsDisplay;
const directionsService = new google.maps.DirectionsService();
let map;

function initMap() {
  directionsDisplay = new google.maps.DirectionsRenderer();
  const chicago = new google.maps.LatLng(41.850033, -87.6500523);
  var mapOptions = {
    zoom: 7,
    center: chicago
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  directionsDisplay.setMap(map);
}

function initAutocomplete() {
  autocompleteStartDest = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById(TEXT_FIELD_START_DEST)));
  autocompleteFinalDest = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */(document.getElementById(TEXT_FIELD_FINAL_DEST)));
};


function main() {
  ReactDOM.render(
    <App />,
    document.getElementById('app')
  );

  initAutocomplete();
  initMap();
};

main();