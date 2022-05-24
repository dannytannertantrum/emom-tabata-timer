const durationInput = document.querySelector('#duration')
const activeInput = document.querySelector('#active')
const restInput = document.querySelector('#rest')
const cyclesInput = document.querySelector('#cycles')
const errorField = document.querySelector('#error')
const workoutStyle = document.querySelector('#workoutStyle')
const resetButton = document.querySelector('#reset')
const submitButton = document.querySelector('#submit')
const emomFieldset = document.querySelector('#emomFieldset')
const tabataFieldset = document.querySelector('#tabataFieldset')
const displayContainer = document.querySelector('.displayContainer')
const durationContainer = document.querySelector('.durationContainer')
const restContainer = document.querySelector('.restContainer')
const timerDisplay = document.querySelector('.displayTimeLeft')
const intervalTimerDisplay = document.querySelector('.displayIntervalTime')
const restTimerDisplay = document.querySelector('.displayRestTime')
const intervalChangeSound = new Audio('interval-change.mp3')
const workoutOverSound = new Audio('workout-over.mp3')
const validateNumbersOnly = /^[0-9\.]+$/
const inputs = [durationInput, activeInput, restInput, cyclesInput]

let formSubmitted = false
let wakeLock = null
let countdown

const onInputChange = () => {
  if (formSubmitted) errorField.classList.remove('show')
  formSubmitted = false
}

const onWorkoutStyleChange = () => {
  if (workoutStyle.checked) {
    emomFieldset.classList.remove('show')
    tabataFieldset.classList.add('show')
  } else {
    tabataFieldset.classList.remove('show')
    emomFieldset.classList.add('show')
  }
}

const acquireLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen')
  } catch (err) {
    console.log(`${err.name}, ${err.message}`)
  }
}

const releaseLock = () => {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null
    })
  }
}

const resetTimer = () => {
  formSubmitted = false
  clearInterval(countdown)
  submitButton.classList.remove('hide')
  resetButton.classList.remove('show')
  durationContainer.classList.remove('show')
  restContainer.classList.remove('show')
  intervalTimerDisplay.classList.remove('off')
  displayContainer.classList.remove('showDisplay')
  releaseLock()
}

const handleVisibilityChange = () => (
  document.visibilityState === 'hidden' ? releaseLock() : acquireLock()
)

const startTimer = async (duration = null, interval, rest = null) => {
  acquireLock()

  displayContainer.classList.add('showDisplay')
  submitButton.classList.add('hide')
  resetButton.classList.add('show')

  const now = Date.now()
  let thenInterval
  let thenDuration
  let thenRest
  let active = true

  if (duration) {
    thenDuration = now + duration * 1000
    displayTimeLeft(duration, 'duration')
    durationContainer.classList.add('show')
  }
  if (rest) {
    displayTimeLeft(rest, 'rest')
    restContainer.classList.add('show')
  }
  thenInterval = now + interval * 1000
  displayTimeLeft(interval, 'interval')

  countdown = setInterval(() => {
    let secondsLeftDuration
    let secondsLeftRest

    if (duration) secondsLeftDuration = Math.round((thenDuration - Date.now()) / 1000)

    if (active || !rest) {
      secondsLeftInterval = Math.round((thenInterval - Date.now()) / 1000)
      displayTimeLeft(secondsLeftInterval, 'interval')
    } else {
      secondsLeftRest = Math.round((thenRest - Date.now()) / 1000)
      displayTimeLeft(secondsLeftRest, 'rest')
    }

    if (
      ((secondsLeftInterval <= 0 && secondsLeftDuration > secondsLeftInterval) ||
        (secondsLeftInterval <= 0 && !duration)) && active
    ) {
      if (rest && active) {
        thenRest = Date.now() + rest * 1000
        intervalTimerDisplay.classList.add('off')
        restTimerDisplay.classList.remove('off')
        displayTimeLeft(rest, 'rest')
      }
      if (!rest) {
        thenInterval = Date.now() + interval * 1000
        displayTimeLeft(interval, 'interval')
      }

      intervalChangeSound.play()
      if (rest) active = false
    }

    if ((secondsLeftRest <= 0 && secondsLeftDuration > secondsLeftRest) ||
      (secondsLeftRest <= 0 && !duration)) {
      active = true
      thenRest = Date.now() + rest * 1000
      thenInterval = Date.now() + interval * 1000

      intervalTimerDisplay.classList.remove('off')
      restTimerDisplay.classList.add('off')
      displayTimeLeft(interval, 'interval')
      intervalChangeSound.play()
    }

    if (secondsLeftDuration <= 0) {
      clearInterval(countdown)
      releaseLock()
      workoutOverSound.play()
    }

    if (duration) displayTimeLeft(secondsLeftDuration, 'duration')
  }, 1000)
}

const displayTimeLeft = (seconds, str) => {
  const minutes = Math.floor(seconds / 60)
  const remainderSeconds = seconds % 60
  const display = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`
  if (str === 'duration') {
    document.title = display
    timerDisplay.textContent = display
  } else if (str === 'interval') {
    intervalTimerDisplay.textContent = display
  } else {
    restTimerDisplay.textContent = display
  }
}

const validateForm = () => {
  formSubmitted = true
  let duration

  if (duration && !durationInput.value.match(validateNumbersOnly)) {
    errorField.classList.add('show')
    return
  } else {
    duration = durationInput.value * 60
  }

  // EMOM
  if (!workoutStyle.checked) {
    if (
      !cyclesInput.value.match(validateNumbersOnly)) {
      errorField.classList.add('show')
    } else {
      const interval = parseInt(cyclesInput.value)
      startTimer(duration, interval)
    }
  }

  // Tabata
  if (workoutStyle.checked) {
    if (
      !activeInput.value.match(validateNumbersOnly) ||
      !restInput.value.match(validateNumbersOnly)
    ) {
      errorField.classList.add('show')
    } else {
      const active = parseInt(activeInput.value)
      const rest = parseInt(restInput.value)
      startTimer(duration, active, rest)
    }
  }
}

inputs.forEach(input => input.addEventListener('keyup', onInputChange))
resetButton.addEventListener('click', resetTimer)
workoutStyle.addEventListener('change', onWorkoutStyleChange)
document.addEventListener('visibilitychange', handleVisibilityChange)
