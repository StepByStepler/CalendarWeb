var loginHTML = document.querySelector('link[href="html/login.html"]').import;
var loginPage = loginHTML.querySelector('div');

var loginField;
var passwordField;
var loginType;

var calendar = document.querySelector('link[href="html/calendar.html"]').import.querySelector('div');
var dayDivs;
var minutesTable;
var minutesTableLoaded = false;

var weekDayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Cуббота'];

var calendarOpened = false;
var mousePressed = false;
var selectedRectIsFinal = false;

var id;
var rect;
var textField;
var fromX, fromY;
var pixelsPerMinute;
var date;
var selectedDay;

var upCode = 38;
var downCode = 40;
var shiftCode = 16;
var deleteCode = 46;
var shiftPressed = false;

var selectedRectColor = '#DED951';
var finalRectColor = '#44C8DC';

var oldDateFrom, oldDateTo;
var oldTop, oldHeight;
var oldText;

var req = new XMLHttpRequest();
    req.onreadystatechange = getReadyStateHandler(req);

attemptLoginWithCookie();

function attemptLoginWithCookie() {
    var login = getCookie('login');
    var password = getCookie('password');
    if(login && password) {
        req.open('GET', '/greeting/attemptLogin?login=' + login + '&password=' + password, true);
        req.send();
        loginType = 'cookie';
    } else {
        document.body.appendChild(loginPage);
        loginField = document.querySelector('input[name="login"]');
        passwordField = document.querySelector('input[name="password"]');
    }
}

function attemptLogin() {
    loginType = 'field';
    req.open('GET', '/greeting/attemptLogin?login=' + loginField.value + '&password=' + passwordField.value, true);
    req.send();
}

function login(json) {
    if(json.success === true) {
        id = json.id;
        var expDate = new Date();
        expDate.setTime(expDate.getTime() + 31 * 24 * 60 * 60 * 1000);
        if(loginType === 'field') {
            saveCookie('login', loginField.value, expDate);
            saveCookie('password', passwordField.value, expDate);
        }
        loadCalendar(id);
    }
    else {
        alert('incorrect login/password!');
    }
}

function attemptRegister() {
    var loginField = document.querySelector('input[name="login"]');
    var passwordField = document.querySelector('input[name="password"]');
    if(loginField.value !== '' && passwordField.value !== '') {
        req.open('GET', '/greeting/attemptRegister?login=' + loginField.value + '&password=' + passwordField.value, true);
        req.send();
    }
}

function register(json) {
    if(json.success === true) {
        loginType = 'field';
        id = json.id;
        loadCalendar(id);
    }
    else {
        alert('login exists!');
    }
}

function loadCalendar(id) {
    if(!calendarOpened && loginType === 'field') {
        document.body.removeChild(loginPage);
    }
    document.body.appendChild(calendar);

    loadVariables();
    initListeners();
    if(!minutesTableLoaded) {
        drawTable();
    }
    drawDayNames();
    addPrevDates(id);

    document.onkeydown = function(e) {
        if(rect) {
            var top = parseFloat(rect.style.top);
            var height = parseFloat(rect.style.height);
            if (e.keyCode === upCode) {
                e.preventDefault();
                if (shiftPressed && getMinutesFromLocation(height) > 15) {
                    rect.style.height = (height - 15 * pixelsPerMinute) + 'px';
                } else if (!shiftPressed && getMinutesFromLocation(top) >= 15) {
                    rect.style.top = (top - 15 * pixelsPerMinute) + 'px';
                    rect.style.height = (height + 15 * pixelsPerMinute) + 'px';
                }
            }
            else if(e.keyCode === downCode) {
                e.preventDefault();
                if (shiftPressed && getMinutesFromLocation(height) >= 15) {
                    rect.style.top = (top + 15 * pixelsPerMinute) + 'px';
                    rect.style.height = (height - 15 * pixelsPerMinute) + 'px';
                } else if (top + height + 15 * pixelsPerMinute <= parseFloat(dayDivs[selectedDay].getBoundingClientRect().height)) {
                    rect.style.height = (height + 15 * pixelsPerMinute) + 'px';
                }
            }
            else if(e.keyCode === shiftCode) {
                e.preventDefault();
                shiftPressed = true;
            }
            else if(e.keyCode === deleteCode) {
                if(selectedRectIsFinal) {
                    attemptDeleteDate();
                }
            }
        }
    };

    document.onkeyup = function (e) {
        if(e.keyCode === shiftCode) {
            shiftPressed = false;
        }
    };
}

function loadVariables() {
    if(!calendarOpened) {
        date = new Date();
        date.setDate(date.getDate() + 1 - date.getDay());
        date.setTime(date.getTime() - date.getTime() % (1000 * 60 * 60 * 24));
        date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    }
    textField = document.querySelector('form input[name="dateinfo"]');
    minutesTable = document.querySelector('.calendar > div:nth-child(2) > div:nth-child(1) > div');
    pixelsPerMinute = document.querySelector('.calendar > div:last-child').getBoundingClientRect().height / (60 * 24);
    calendarOpened = true;

    dayDivs = document.querySelectorAll('.calendar > div:last-child > div:not(:first-child) > div');
    dayDivs.contains = function(value) {
        for (var i = 0; i < dayDivs.length; i++) {
            if(dayDivs[i] === value) {
                return true;
            }
        }
        return false;
    }
}

function drawTable() {
    for(var i = 0; i < 1440; i += 60) {
        var block = document.createElement('div');
        block.style.top = i * pixelsPerMinute + 'px';
        block.style.height = 60 * pixelsPerMinute + 'px';

        var hour = parseInt(i / 60);
        var minutes = i - hour * 60;
        hour = hour < 10 ? '0' + hour : hour;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        block.textContent = hour + ':' + minutes;
        minutesTable.append(block);
    }
    minutesTableLoaded = true;
}

function initListeners() {
    for (var i = 0; i < dayDivs.length; i++) {
        (function() {
            var block;
            var day = i + 1;
            dayDivs[i].onmousedown = function(e) {
                if(calendarOpened && e.target === dayDivs[day - 1]) {
                    mousePressed = true;

                    console.log(e.target);
                    console.log(day - 1);
                    console.log(dayDivs[day - 1]);
                    if(rect) {
                        if(!selectedRectIsFinal) {
                            dayDivs[selectedDay].removeChild(rect);
                        }
                        else {
                            rect.style.background = finalRectColor;
                        }
                    }

                    block = document.createElement('div');
                    block.onmousedown = function (e) {
                        if(rect) {
                            if(selectedRectIsFinal) {
                                rect.style.background = finalRectColor;
                            } else {
                                dayDivs[selectedDay].removeChild(rect);
                            }
                        }
                        rect = this;
                        rect.style.background = selectedRectColor;
                        selectedDay = day - 1;
                        selectedRectIsFinal = true;

                        oldDateFrom = convertLocationToDate(selectedDay, parseFloat(rect.style.top));
                        oldDateTo = convertLocationToDate(selectedDay, parseFloat(rect.style.top) + parseFloat(rect.style.height));

                        oldTop = rect.style.top;
                        oldHeight = rect.style.height;

                        oldText = rect.innerHTML;
                    };

                    rect = block;
                    selectedDay = day - 1;
                    block.style.top = roundToFifteen(e.offsetY) + 'px';
                    block.style.height = '0px';
                    block.style.background = selectedRectColor;
                    this.append(block);
                    selectedRectIsFinal = false;
                }
            };

            dayDivs[i].onmouseup = function(e) {
                if(calendarOpened && block) {
                    mousePressed = false;
                }
            };

            dayDivs[i].onmousemove = function(e) {
                if(calendarOpened && block && mousePressed) {
                    var bottom = parseFloat(block.style.top) + parseFloat(block.style.height);
                    console.log(e.pageY < bottom);
                    block.style.height = roundToFifteen(e.pageY - block.getBoundingClientRect().top - pageYOffset) + 'px';
                    fromX = e.pageX;
                    fromY = e.pageY;
                }
            };

            dayDivs[i].onkeydown = function (e) {
                console.log(e.keyCode);
            }
        })();
    }
}

function drawDayNames() {
    var dayNames = document.querySelectorAll('.calendar > div:first-child > div:not(:first-child)');
    var dateCopy = new Date(date.getTime());
    for (var i = 0; i < dayNames.length; i++, dateCopy.setTime(dateCopy.getTime() + 24 * 60 * 60 * 1000)) {
        dayNames[i].innerHTML = weekDayNames[dateCopy.getDay()] + ' ' + formatDate(dateCopy);
    }
}

function addPrevDates(id) {
    var dateTo = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    getWeekData(id, formatFullDate(date), formatFullDate(dateTo));
}

function getWeekData(id, dateFrom, dateTo) {
    req.open('GET', '/greeting/getweekdata?id=' + id + '&date_from=' + dateFrom + '&date_to=' + dateTo, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
}

function getReadyStateHandler(req) {
    return function() {
        if(req.readyState === 4) {
            if(req.status === 200) {
                printJSON(req.responseText);
            } else {
                alert("HTTP error: " + req.status + " Text: " + req.responseText);
            }
        }
    }
}

function printJSON(text) {
    //alert(text);
    var json = JSON.parse(text);
    console.log(json);
    if(json.response_type === 'prevDates') {
        drawPrevDates(json);
    } else if(json.response_type === 'attemptLogin') {
        login(json);
    } else if(json.response_type === 'attemptRegister') {
        register(json);
    } else if(json.response_type === 'insertDate') {
        insertDate(json);
    } else if(json.response_type === 'updateDate') {
        updateDate(json);
    } else if(json.response_type === 'attemptDeleteDate') {
        deleteDate(json);
    }
}

function submit() {
    if(rect) {
        var dateFrom = new Date(date);
        dateFrom.setTime(dateFrom.getTime() - dateFrom.getTimezoneOffset());
        dateFrom.setTime(dateFrom.getTime() + selectedDay * 24 * 60 * 60 * 1000);
        var dateTo = new Date(dateFrom);

        dateTo.setTime(dateFrom.getTime() + getMinutesFromLocation(parseFloat(rect.style.top)
            + parseFloat(rect.style.height)) * 60 * 1000);
        dateFrom.setTime(dateFrom.getTime() + getMinutesFromLocation(parseFloat(rect.style.top)) * 60 * 1000);

        var text = document.querySelector('input[name="dateinfo"]').value;

        if(selectedRectIsFinal) {
            req.open('GET', '/greeting/updateDate?id=' + id + '&oldDateFrom=' + formatFullDate(oldDateFrom) + '&oldDateTo=' + formatFullDate(oldDateTo)
                     + '&newDateFrom=' + formatFullDate(dateFrom) + '&newDateTo=' + formatFullDate(dateTo) + '&newInfo=' + text);
            req.send();
        }
        else {
            req.open('GET', '/greeting/insertDate?id=' + id + '&dateFrom=' + formatFullDate(dateFrom) +
                '&dateTo=' + formatFullDate(dateTo) + '&info=' + text);
            req.send();
        }
    }
}

function insertDate(json) {
    if(json.success === true) {
        oldDateFrom = convertLocationToDate(selectedDay, parseFloat(rect.style.top));
        oldDateTo = convertLocationToDate(selectedDay, parseFloat(rect.style.top) + parseFloat(rect.style.height));

        rect.style.background = finalRectColor;
        //var text = document.createTextNode(document.querySelector('input[name="dateinfo"]').value);
        //rect.append(text);
        rect.innerHTML = document.querySelector('input[name="dateinfo"]').value;


        // var createdRectDay = selectedDay;
        //
        // rect.onmousedown = function (e) {
        //     if(rect) {
        //         rect.style.background = '#44C8DC';
        //     }
        //
        //     rect = this;
        //     rect.style.background = '#DED951';
        //     selectedDay = createdRectDay;
        //     selectedRectIsFinal = true;
        //
        //     oldDateFrom = convertLocationToDate(createdRectDay, parseFloat(rect.style.top));
        //     oldDateTo = convertLocationToDate(createdRectDay, parseFloat(rect.style.top) + parseFloat(rect.style.height));
        // };

    } else {
        dayDivs[selectedDay].removeChild(rect);
    }
    selectedRectIsFinal = false;
    rect = undefined;
}

function updateDate(json) {
    if(json.success === true) {
        rect.style.background = finalRectColor;
    } else {
        cancelRectChanges();
    }
}

function attemptDeleteDate() {
    req.open('GET', '/greeting/deleteDate?accountId=' + id + '&dateFrom=' + formatFullDate(oldDateFrom) + '&dateTo=' + formatFullDate(oldDateTo));
    req.send();
}

function deleteDate(json) {
    if(json.success === true) {
        dayDivs[selectedDay].removeChild(rect);
        rect = undefined;
    } else {
        cancelRectChanges();
    }
}

function loadNext() {
    clearDates();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    loadCalendar(id);
}

function loadPrev() {
    clearDates();
    date.setTime(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    loadCalendar(id);
}


function drawPrevDates(json) {
    var days = json['dates'];
    for(var i = 0; i < days.length; i++) {
        var day = days[i];

        var dates = day['dates'];
        for(var j = 0; j < dates.length; j++) {
            var currentDate = dates[j];
            drawDate(i, currentDate);
        }
    }
}

function drawDate(index, date) {
    var dateFrom = new Date(date.date_from);
    var dateTo = new Date(date.date_to);
    var info = date.info;

    var minutesFrom = dateFrom.getHours() * 60 + dateFrom.getMinutes();
    var minutesTo = dateTo.getHours() * 60 + dateTo.getMinutes();

    var startY = minutesFrom * pixelsPerMinute;
    var endY = minutesTo * pixelsPerMinute;
    var diff = parseFloat(endY - startY);

    var block = document.createElement('div');
    block.style.top = startY + 'px';
    block.style.height = diff + 'px';
    block.style.background = finalRectColor;

    block.innerHTML = info;

    block.onmousedown = function (e) {
        if(rect) {
            if(selectedRectIsFinal) {
                rect.style.background = finalRectColor;
            } else {
                dayDivs[selectedDay].removeChild(rect);
            }
        }
        rect = this;
        console.log('before: ' + rect.style.background);
        rect.style.background = selectedRectColor;
        console.log('after: ' + rect.style.background);
        this.style.background = selectedRectColor;
        selectedDay = index;
        selectedRectIsFinal = true;

        oldDateFrom = convertLocationToDate(selectedDay, parseFloat(rect.style.top));
        oldDateTo = convertLocationToDate(selectedDay, parseFloat(rect.style.top) + parseFloat(rect.style.height));
    };

    dayDivs[index].append(block);
}

function logout() {
    clearDates();
    calendarOpened = false;
    document.body.appendChild(loginPage);
    deleteCookie('login');
    deleteCookie('password');
    if(!loginField) {
        loginField = document.querySelector('input[name="login"]');
        passwordField = document.querySelector('input[name="password"]');
    }
}

function clearDates() {
    for (var i = 0; i < dayDivs.length; i++) {
        dayDivs[i].innerHTML = '';
    }

    var calendarPage = document.body.querySelector('.wrapper');
    document.body.removeChild(calendarPage);
}

function roundToFifteen(y) {
    return y - y % (15 * pixelsPerMinute);
}

function formatFullDate(date) {
    //"yyyy/MM/dd HH:mm"
    var hour = date.getHours();
    var min = date.getMinutes();

    return formatDate(date) + ' ' + hour + ':' + min;
}

function formatDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    return year + '/' + (month < 10 ? '0' : '') + month + '/' + day;
}

function getMinutesFromLocation(y) {
    return Math.round(y / pixelsPerMinute);
}

function convertLocationToDate(day, y) {
    var result = new Date(date.getTime());
    result.setTime(result.getTime() + day * 24 * 60 * 60 * 1000);
    result.setTime(result.getTime() + getMinutesFromLocation(y) * 60 * 1000);
    console.log(y);
    console.log(getMinutesFromLocation(y));
    return result;
}

function cancelRectChanges() {
    rect.style.top = oldTop;
    rect.style.height = oldHeight;
    rect.style.background = finalRectColor;
    rect.innerHTML = oldText;
    rect = undefined;
}

function saveCookie(name, value, expDate) {
    var cookie = name + '=' + escape(value);
    expDate.setTime(expDate.getTime() - expDate.getTimezoneOffset());
    if(expDate) {
        cookie += '; expires=' + expDate.toUTCString();
    }
    document.cookie = cookie;
}

function getCookie(name) {
    var results = document.cookie.match ('(^|;) ?' + name + '=([^;]*)(;|$)');
    if(results) {
        return unescape(results[2]);
    }
    return undefined;
}

function deleteCookie(name) {
    var negativeDate = new Date();
    negativeDate.setTime(negativeDate.getTime() - 1);
    document.cookie = name + '=; expires=' + negativeDate.toUTCString();
}