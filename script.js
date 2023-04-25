'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//+ //+ //+ //+

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; //: [ Lat lng]
    this.distance = distance; //: in km
    this.duration = duration; //: in mins
  }
  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

const work = new Workout([1, 1], 1, 1);
//+ //+
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
    return this.pace;
  }
}
//+ //+
class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = (this.distance / this.duration / 60).toFixed(1);
    return this.speed;
  }
}

//+

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new Cycling([39, -12], 5.2, 24, 178);
// console.log(run1.clicks());
// console.log(cycle1);

//+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+
// APPLICATION ARCHITECHURE
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get User Position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handler
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert('Could not get your position');
      });
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // HANDLING CLICK on MAP
    this.#map.on('click', this._showForm.bind(this));

    // Load Marker form Local storage
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
      this._rendderWorkoutMaker(work);
    });
  }

  //[ SHOW FORM ]
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  //[ HIDE FORM ]
  _hideForm() {
    // Empty input
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  //[ TOGGLE FORM ]
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //- //[ NEW WORKUOT ]

  _newWorkOut(e) {
    function validInput(...inputs) {
      return inputs.every((inp) => Number.isFinite(inp) && inp > 0);
    }
    e.preventDefault();

    // Get Data from Form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (!this.#mapEvent) return alert('Click Map');
    const { lat, lng } = this.#mapEvent.latlng;

    //If workout running, create running Object
    //+ Running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if Data is valid
      if (!validInput(distance, duration, cadence)) return alert('Input have to be positive numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }
    // If workout cycling, create cycling Object
    //+ Cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if Data is valid
      if (!validInput(distance, duration, elevation)) return alert('Input have to be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }

    // Add new Object to workout Array

    // Render workout on MAP as Make
    this._rendderWorkoutMaker(workout);

    // Render work out on list
    this._renderWorkout(workout);

    // Clear Data input
    this._hideForm();

    // Set local storage to all workout
    this._setLocalStirage();
  } //-//: End _newWorkOut

  _rendderWorkoutMaker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          width: 250,
          height: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  } //: End _rendderWorkoutMaker

  _renderWorkout(workout) {
    const html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace || workout.speed}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type == 'running' ? '🦶🏼' : '⛰'}</span>
        <span class="workout__value">${workout.cadence || workout.elevationGain}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    // <span class="workout__value">${workout.calcPace()}</span>
    //
    form.insertAdjacentHTML('afterend', html);
  }
  //-
  _moveToPopup(e) {
    const workoutEL = e.target.closest('.workout');
    if (!workoutEL) return;
    const target = this.#workouts.find((work) => work.id === workoutEL.dataset.id);
    this.#map.setView(target.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    target.click();
  }
  _setLocalStirage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;

    // this.#workouts.forEach((work) => {
    // this._renderWorkout(work);
    // this._rendderWorkoutMaker(work)
    // });
  }
  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
} //: End Class App

//+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+ //+

const man = new App();

// const test = new Running([300, 20], 5, 5, 10);
// console.log(test._setDescription());
// man._renderWorkout(test);

// const test2 = new Cycling([300, 20], 5, 5, 2);
// console.log(test2.calcSpeed());
// man._renderWorkout(test2);
