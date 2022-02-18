// Tea Timer 
// Author: Thomas Fehling
//------------------------------------------------------------
// Tea Timer Menu and Settings Menu

// Configuration (saved as file teatimer.conf)
var conf = {
  startWithMenu: false,
  timer1: 180,
  timer2: 300,
  timer3: 600,
  load: function() { 
    var tempConf = require("Storage").readJSON("teatimer.conf", true);
    if (typeof tempConf != "undefined") {
      conf.startWithMenu = tempConf.startWithMenu;
      conf.timer1 = tempConf.timer1;
      conf.timer2 = tempConf.timer2;
      conf.timer3 = tempConf.timer3;
      }
    },
  save: function() { require("Storage").writeJSON("teatimer.conf", conf);}
};

var timer1s =  "T1 ";
var timer2s =  "T2 ";
var timer3s =  "T3 ";

function updateMenuItemNames() {
  timer1s =  "T1 " + timeFormated(conf.timer1);
  timer2s =  "T2 " + timeFormated(conf.timer2);
  timer3s =  "T3 " + timeFormated(conf.timer3);  
}

var menuShownOnce = false;

function showTeaTimerMenu() {
  menuShownOnce = true;
  updateMenuItemNames();
  var timerMenu = {
    "" : { "title" : "-- Tea Timer --" },
    };
  timerMenu[timer1s] = function(){ E.showMenu(); initTimerWithTime(conf.timer1); };
  timerMenu[timer2s] = function(){ E.showMenu(); initTimerWithTime(conf.timer2); };
  timerMenu[timer3s] = function(){ E.showMenu(); initTimerWithTime(conf.timer3); };
  timerMenu.Help = function(){ E.showMenu(); showHelp(0); };
  timerMenu.Settings = function(){ showSettingsMenu(); };
  timerMenu.Exit = function (){ E.showMenu(); Bangle.showLauncher(); };
  E.showMenu(timerMenu);
}

function showSettingsMenu() {
  var startMode = "Start Mode: Timer1";
  if (conf.startWithMenu) { startMode = "Start Mode: Menu"; }
  var settingsMenu = {
  "" : { "title" : "Tea Timer Settings" },
  "< Back" : function() { conf.save(); showTeaTimerMenu(); },
  };
  settingsMenu[startMode] = showStartModeMenu;
  settingsMenu[timer1s] = {
    value : conf.timer1,
    min:0,max:6000,step:15,
    onchange : v => { conf.timer1=v; }
  };
  settingsMenu[timer2s] = {
    value : conf.timer2,
    min:0,max:6000,step:15,
    onchange : v => { conf.timer2=v; }
  };
  settingsMenu[timer3s] = {
    value : conf.timer3,
    min:0,max:6000,step:15,
    onchange : v => { conf.timer3=v; }
  };
  E.showMenu(settingsMenu);
}

function showStartModeMenu() {
  var startModeMenu = {
  "" : { "title" : "Timer Start Mode" },
  "Start Timer1" : function() { conf.startWithMenu = false; showSettingsMenu(); },
  "Start with Menu" : function() { conf.startWithMenu = true; showSettingsMenu(); },
  };
  E.showMenu(startModeMenu);
}

//------------------------------------------------------------
// Help pages
const helpPages = [
  "Swipe to move betwenn help pages.\nPress Btn1 to return to tea timer.",
  "Help: help pages", // page title
  "Swipe up/down\n+/- one minute\n\nSwipe left/right\n+/- 15 seconds\n\nPress Btn1 to start",
  "Help: Timer(1)", // page title
  "Simply tap on the screen to enter the menu.", 
  "Help: Timer(1)", // page title
  "The menu lets you select one of three predefined timer values.", 
  "Help: Menu", // page title
  "The settings menu lets you edit three predefined timer values. You can also choose the apps start mode.", 
  "Help: Settings", // page title
  " "
  ];
const maxHelpPages = 8;
var curHelpPage = 0;

//------------------------------------------------------------
// Tea Timer
let drag;
var counter = 0;
var counterStart = 0;
var counterInterval;
const states = {
  init: 1, // unused
  help: 2, // show help text
  start: 4, // show/change initial counter
  count: 8, // count down
  countUp: 16, // count up after timer finished
  menu: 32, // show menu
  stop: 64 // timer stopped
};
var state = states.start;
E.setTimeZone(1);

// Title showing current time
function appTitle() {
  return "Tea Timer " + currentTime();
}

function currentTime() {
  min = Date().getMinutes();
  if (min < 10) min = "0" + min;
  return Date().getHours() + ":" + min;
}

function timeFormated(sec) {
  var min = Math.floor(sec / 60);
  sec = sec % 60;
  if (sec < 10) sec = "0" + sec;
  return min + ":" + sec;
}

// initialize timer and show timer value => state: start
function initTimer() {
  counter = counterStart;
  setState(states.start);
  showCounter(true);
}

function initTimerWithTime(t){
  E.showMenu();
  Bangle.touch = undefined;
  Bangle.on('touch', function(button, xy) { showMenu(); });
  counterStart = t;
  initTimer();
}

// timer value (counter) can be changed in state start
function changeCounter(diff) {
  if (state == states.start) {
    if (counter + diff > 0) {
      counter = counter + diff;
      showCounter(true);
    }
  }
}

// start or restart timer => state: count
function startTimer() {
  counterStart = counter;
  setState(states.count);
  countDown();
  if (!counterInterval)
    counterInterval = setInterval(countDown, 1000);
}

/* show current counter value at start and while count down
  Show
  - Title with current time
  - initial timer value
  - remaining time
  - hint for help in state start
*/ 
function showCounter(withHint) {
  //g.clear();
  E.showMessage("", appTitle());
  g.setFontAlign(0,0); // center font
  // draw the current counter value
  g.setBgColor(-1).setColor(0,0,1); // blue
  g.setFont("Vector",20); // vector font, 20px  
  g.drawString("Timer: " + timeFormated(counterStart),80,55);
  g.setFont("Vector",60); // vector font, 60px  
  g.drawString(timeFormated(counter),83,100);
  if (withHint) {
    g.setFont("Vector",20); // vector font, 80px
    g.drawString("Tap for Menu",80,150);
  }
}

// count down and update every second
// when time is up, start counting up
function countDown() {
  counter--;
  // Out of time
  if (counter<=0) {
    outOfTime();
    countUp();
    counterInterval = setInterval(countUp, 1000);
    return;
  }
  showCounter(false);
}

// 
function outOfTime() {
  E.showMessage("Time is up!",appTitle());
  setState(states.countUp);
  resetTimer();
  Bangle.buzz();
  Bangle.buzz();
}

/* this counts up (one minute), after time is up
  Show
  - Title with current time
  - initial timer value
  - "Time is up!"
  - time since timer finished
*/
function countUp() {
  // buzz for 15 seconds
  counter++;
  if (counter <=15) {
    Bangle.buzz();
  }
  // stop counting up after 60 seconds
  if (counter > 60) {
    outOfTime();
    return;
  }
  g.clear();
  E.showMessage("", appTitle());
  g.setFontAlign(0,0); // center font
  g.setBgColor(-1).setColor(0,0,1); // blue
  g.setFont("Vector",20); // vector font, 20px
  g.drawString("Timer: " + timeFormated(counterStart),80,55);
  g.setFont("Vector",30); // vector font, 80px  
  g.setBgColor(-1).setColor(1,0,0); // red
  g.drawString("Time is up!",85,85);
  g.setFont("Vector",40); // vector font, 80px
  // draw the current counter value
  g.drawString(timeFormated(counter),80,130);
}

// reset when interupted by user oder 60 seconds after timer finished
function resetTimer() {
  clearInterval();
  counterInterval = undefined;
}

// timer is stopped by user => state: stop
function stopTimer() {
  resetTimer();
  E.showMessage("Timer stopped!", appTitle());
  setState(states.stop);
}

// timer is stopped by user while counting up => state: start
function stopTimer2() {
  resetTimer();
  initTimer();
}

//------------------------------------------------------------
// Manage States and User Input 
function setState(st) {
  state = st;
}

function buttonPressed() {
  switch(state) {
    case states.init:
      initTimer();
      break;
    case states.help:
      initTimer();
      break;
    case states.start:
      startTimer();
      break;
    case states.count:
      stopTimer();
      break;
    case states.countUp:
      stopTimer2();
      break;
    case states.stop:
      initTimer();
      break;
    case states.menu:
      break;
    default:
      initTimer();
      break;
  }
}

/* Change initial counter value by swiping / next or prev. help page
    swipe up: +1 minute
    swipe down: -1 minute
    swipe right: +15 seconds
    swipe left: -15 seconds */
function initDragEvents() {
  Bangle.on("drag", e => {
  if (state == states.start || state == states.help) {
    if (!drag) { // start dragging
      drag = {x: e.x, y: e.y};
    } else if (!e.b) { // released
      const dx = e.x-drag.x, dy = e.y-drag.y;
      drag = null;
      if (Math.abs(dx)>Math.abs(dy)+10) {
        // horizontal
        if (state == states.start) {
          changeCounter(dx>0 ? 15 : -15);
        }
        else {
          showHelp(dx>0 ? 1 : -1);
        }
      } else if (Math.abs(dy)>Math.abs(dx)+10) {
        // vertical
        if (state == states.start) {
          changeCounter(dy>0 ? -60 : 60);
        }
        else {
          showHelp(dy>0 ? -1 : 1);
        }
      }
    }
  }
});
}

// show help text (pnr = 0, -1, +1)
function showHelp(pnr) {
  state = states.help;
  if (pnr == 0) { 
    curHelpPage = 0; // first page
  }
  else {
    // next or previous page
    curHelpPage += pnr*2;
    if (curHelpPage < 0 || curHelpPage > maxHelpPages) { curHelpPage = 0; }
  }
  E.showMessage(helpPages[curHelpPage],helpPages[curHelpPage+1]);
}

// show tea timer menu on touch while in start state, else do nothing
function showMenu() {
  if (state == states.start) {
    setState(states.menu);
    if (menuShownOnce) {
      E.showPrompt("This is for technical reasons...",
        {title: "Press Continue",
          buttons: {"Continue":1}}
        ).then(function(v) { showTeaTimerMenu(); });
    }
    else {
      showTeaTimerMenu();
    }
  }
}

//------------------------------------------------------------

  // drag events in start state (to change counter value)
  initDragEvents();
  // Show help text in start state
  //Bangle.on('touch', function(button, xy) { showMenu(); });
  // event handling for button1
  setWatch(buttonPressed, BTN1, {repeat: true});
	// read configuration
	conf.load();
	if (conf.startWithMenu) {
		// display menu at start
    setState(states.menu);
		showTeaTimerMenu();
	}
	else // start with timer and use timer default value
	{
    initTimerWithTime(conf.timer1);
	}
